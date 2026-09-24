import { z } from "zod";

const objectIdPattern = /^[a-f\d]{24}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const objectIdSchema = z.string().regex(objectIdPattern, "Invalid database identifier");
export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(160, "Slug cannot exceed 160 characters")
  .regex(slugPattern, "Slug may only contain lowercase letters, numbers, and hyphens");

export const attributeValueSchema = z.union([
  z.string().min(1),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().min(1)).min(1),
]);

export const productAttributeSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(80)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Attribute key may contain letters, numbers, underscores, and hyphens"
    ),
  label: z.string().min(1).max(120),
  value: attributeValueSchema,
  unit: z.string().max(30).optional(),
  group: z.string().max(80).optional(),
  sortOrder: z.number().int().min(0).max(10000).default(0),
});

const productAttributesSchema = z
  .array(productAttributeSchema)
  .max(100)
  .refine(
    (items) => new Set(items.map((item) => item.key.toLowerCase())).size === items.length,
    "Attribute keys must be unique within the same item"
  );

const productImagesSchema = z
  .array(
    z.object({
      url: z.string().url().max(2048),
      publicId: z.string().max(255).optional(),
      alt: z.string().max(160).default(""),
      sortOrder: z.number().int().min(0).max(10000).default(0),
      isPrimary: z.boolean().default(false),
    })
  )
  .max(20)
  .refine(
    (items) => items.filter((item) => item.isPrimary).length <= 1,
    "Only one product image can be marked as primary"
  );

export const variantOptionSchema = z.object({
  name: z.string().min(1).max(80),
  value: z.string().min(1).max(120),
});

export const unitOfSaleSchema = z.enum([
  "PIECE",
  "METER",
  "ROLL",
  "PACK",
  "SET",
  "BOX",
  "PAIR",
  "KG",
  "GRAM",
  "LITER",
  "ML",
  "OTHER",
]);

export const productStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);
export const productTypeSchema = z.enum(["SIMPLE", "VARIABLE"]);
export const variantStatusSchema = z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]);

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema.optional(),
  parentId: objectIdSchema.optional().nullable(),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().url().max(2048).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(10000).default(0),
});

export const categoryUpdateSchema = categoryCreateSchema.extend({
  id: objectIdSchema,
});

export const brandCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema.optional(),
  description: z.string().trim().max(500).optional(),
  logoUrl: z.string().url().max(2048).optional().or(z.literal("")),
  website: z.string().url().max(2048).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10000).default(0),
});

export const brandUpdateSchema = brandCreateSchema.extend({
  id: objectIdSchema,
});

export const productTaxSchema = z.object({
  hsnCode: z
    .string()
    .trim()
    .max(20)
    .regex(/^[A-Za-z0-9./_-]*$/, "HSN/SAC contains unsupported characters")
    .optional()
    .or(z.literal("")),
  gstRate: z.number().finite().min(0).max(100).optional().nullable(),
  isGstInclusive: z.boolean().default(true),
});

export const productCreateSchema = z.object({
  name: z.string().trim().min(2).max(180),
  slug: slugSchema.optional(),
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().max(10000).optional(),
  categoryId: objectIdSchema,
  subcategoryId: objectIdSchema.optional().nullable(),
  brandId: objectIdSchema.optional().nullable(),
  productType: productTypeSchema.default("SIMPLE"),
  status: productStatusSchema.default("DRAFT"),
  searchKeywords: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  images: productImagesSchema.default([]),
  attributes: productAttributesSchema.default([]),
  tax: productTaxSchema.default({ isGstInclusive: true }),
});

export const productUpdateSchema = productCreateSchema.extend({
  id: objectIdSchema,
});

export const moneyPaiseSchema = z
  .number()
  .int()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER);

export const positiveQuantitySchema = z.number().finite().positive().max(1_000_000);

export const variantCreateSchema = z
  .object({
    productId: objectIdSchema,
    sku: z.string().trim().min(2).max(100).regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/),
    title: z.string().trim().max(160).optional(),
    options: z
      .array(variantOptionSchema)
      .max(20)
      .refine(
        (items) => new Set(items.map((item) => item.name.toLowerCase())).size === items.length,
        "Variant option names must be unique"
      )
      .default([]),
    attributes: productAttributesSchema.default([]),
    pricePaise: moneyPaiseSchema,
    mrpPaise: moneyPaiseSchema,
    unitOfSale: unitOfSaleSchema.default("PIECE"),
    minOrderQuantity: positiveQuantitySchema.default(1),
    orderQuantityStep: positiveQuantitySchema.default(1),
    status: variantStatusSchema.default("ACTIVE"),
    trackInventory: z.boolean().default(true),
    lowStockThreshold: z.number().finite().min(0).max(1_000_000).default(5),
    initialStock: z.number().finite().min(0).max(1_000_000_000).default(0),
    imageUrl: z.string().url().max(2048).optional().or(z.literal("")),
    imageAlt: z.string().max(160).optional(),
  })
  .refine((data) => data.mrpPaise >= data.pricePaise, {
    message: "MRP must be greater than or equal to selling price",
    path: ["mrpPaise"],
  })
  .refine(
    (data) => Math.abs(data.minOrderQuantity / data.orderQuantityStep - Math.round(data.minOrderQuantity / data.orderQuantityStep)) < 1e-9,
    {
      message: "Minimum order quantity must align with the order step",
      path: ["minOrderQuantity"],
    }
  );

export const variantUpdateSchema = variantCreateSchema.extend({
  id: objectIdSchema,
});

export const inventoryAdjustmentSchema = z.object({
  variantId: objectIdSchema,
  quantityDelta: z.number().finite().min(-1_000_000_000).max(1_000_000_000).refine((v) => v !== 0, "Adjustment cannot be zero"),
  reason: z.string().trim().min(3).max(200),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type BrandCreateInput = z.infer<typeof brandCreateSchema>;
export type BrandUpdateInput = z.infer<typeof brandUpdateSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type VariantCreateInput = z.infer<typeof variantCreateSchema>;
export type VariantUpdateInput = z.infer<typeof variantUpdateSchema>;
export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;
