"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { connectToDatabase } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { parseMoneyToPaise } from "@/lib/money";
import { Brand } from "@/models/Brand";
import { Category } from "@/models/Category";
import { Inventory } from "@/models/Inventory";
import { InventoryTransaction } from "@/models/InventoryTransaction";
import { Product } from "@/models/Product";
import { ProductVariant } from "@/models/ProductVariant";
import {
  brandCreateSchema,
  brandUpdateSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  inventoryAdjustmentSchema,
  inventorySetSchema,
  objectIdSchema,
  productCreateSchema,
  productUpdateSchema,
  variantCreateSchema,
  variantUpdateSchema,
} from "@/schemas/catalog";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function nullableId(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return value ? value : null;
}

function checkbox(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function numberField(formData: FormData, key: string, fallback = 0): number {
  const raw = text(formData, key);
  if (raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Invalid number for ${key}`);
  return value;
}

function parseJson<T>(raw: string, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("One of the JSON configuration fields is not valid JSON.");
  }
}

function redirectWithMessage(
  path: string,
  key: "success" | "error",
  message: string
): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

function zodMessage(error: unknown): string {
  if (error && typeof error === "object" && "issues" in error) {
    const issues = (error as { issues: Array<{ message: string; path: (string | number)[] }> }).issues;
    return issues
      .slice(0, 3)
      .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
      .join(" ");
  }
  return "Please check the submitted information.";
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

async function getAdminActor() {
  return requireAdmin("/admin");
}

async function assertCategoryParentIntegrity(
  categoryId: string,
  parentId: string | null
) {
  if (!parentId) return;

  if (categoryId === parentId) {
    throw new Error("A category cannot be its own parent.");
  }

  let cursor = parentId;
  const visited = new Set<string>();

  while (cursor) {
    if (visited.has(cursor)) {
      throw new Error("Category hierarchy contains a cycle.");
    }
    visited.add(cursor);

    const parent = await Category.findById(cursor).select("_id parent isActive");
    if (!parent) {
      throw new Error("Selected parent category does not exist.");
    }
    if (!parent.isActive) {
      throw new Error("Selected parent category is inactive.");
    }

    const next = parent.parent ? String(parent.parent) : "";
    if (next === categoryId) {
      throw new Error("This parent selection would create a category cycle.");
    }
    cursor = next;
  }
}

async function assertCategoryCanBeDeactivated(id: string) {
  const [hasChildren, hasActiveProducts] = await Promise.all([
    Category.exists({ parent: id, isActive: true }),
    Product.exists({
      status: "ACTIVE",
      $or: [{ category: id }, { subcategory: id }],
    }),
  ]);

  if (hasChildren) {
    throw new Error(
      "Move or deactivate child categories before deactivating this category."
    );
  }

  if (hasActiveProducts) {
    throw new Error(
      "Move active products to another category before deactivating this category."
    );
  }
}

function productFormPayload(formData: FormData) {
  const images = parseJson(text(formData, "imagesJson"), []);
  const attributes = parseJson(text(formData, "attributesJson"), []);
  const keywords = text(formData, "searchKeywords")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return {
    name: text(formData, "name"),
    slug: text(formData, "slug") || undefined,
    shortDescription: text(formData, "shortDescription") || undefined,
    description: text(formData, "description") || undefined,
    categoryId: text(formData, "categoryId"),
    subcategoryId: nullableId(formData, "subcategoryId"),
    brandId: nullableId(formData, "brandId"),
    productType: text(formData, "productType") || "SIMPLE",
    status: text(formData, "status") || "DRAFT",
    searchKeywords: keywords,
    images,
    attributes,
    tax: {
      hsnCode: text(formData, "hsnCode"),
      gstRate: text(formData, "gstRate") === "" ? null : numberField(formData, "gstRate"),
      isGstInclusive: checkbox(formData, "isGstInclusive"),
    },
  };
}

async function validateProductReferences(
  categoryId: string,
  subcategoryId: string | null,
  brandId: string | null
) {
  const [category, subcategory, brand] = await Promise.all([
    Category.findById(categoryId).select("_id isActive"),
    subcategoryId
      ? Category.findById(subcategoryId).select("_id isActive parent")
      : null,
    brandId ? Brand.findById(brandId).select("_id isActive") : null,
  ]);

  if (!category || !category.isActive) {
    throw new Error("Selected category is unavailable.");
  }

  if (subcategoryId) {
    if (!subcategory || !subcategory.isActive) {
      throw new Error("Selected subcategory is unavailable.");
    }
    if (String(subcategory.parent ?? "") !== categoryId) {
      throw new Error("Selected subcategory does not belong to the selected category.");
    }
  }

  if (brandId && (!brand || !brand.isActive)) {
    throw new Error("Selected brand is unavailable.");
  }
}

function variantFormPayload(formData: FormData) {
  const options = parseJson(text(formData, "optionsJson"), []);
  const attributes = parseJson(text(formData, "attributesJson"), []);

  return {
    productId: text(formData, "productId"),
    id: text(formData, "id") || undefined,
    sku: text(formData, "sku").toUpperCase(),
    title: text(formData, "title") || undefined,
    options,
    attributes,
    pricePaise: parseMoneyToPaise(text(formData, "price")),
    mrpPaise: parseMoneyToPaise(text(formData, "mrp")),
    unitOfSale: text(formData, "unitOfSale") || "PIECE",
    minOrderQuantity: numberField(formData, "minOrderQuantity", 1),
    orderQuantityStep: numberField(formData, "orderQuantityStep", 1),
    status: text(formData, "status") || "ACTIVE",
    trackInventory: checkbox(formData, "trackInventory"),
    lowStockThreshold: numberField(formData, "lowStockThreshold", 5),
    initialStock: numberField(formData, "initialStock", 0),
    imageUrl: text(formData, "imageUrl"),
    imageAlt: text(formData, "imageAlt"),
  };
}

export async function createCategoryAction(formData: FormData) {
  await getAdminActor();

  let input;
  try {
    input = categoryCreateSchema.parse({
      name: text(formData, "name"),
      slug: text(formData, "slug") || undefined,
      parentId: nullableId(formData, "parentId"),
      description: text(formData, "description") || undefined,
      imageUrl: text(formData, "imageUrl"),
      isActive: checkbox(formData, "isActive"),
      isFeatured: checkbox(formData, "isFeatured"),
      sortOrder: numberField(formData, "sortOrder"),
    });
  } catch (error) {
    redirectWithMessage("/admin/categories", "error", zodMessage(error));
  }

  try {
    await connectToDatabase();
    await assertCategoryParentIntegrity("", input.parentId ?? null);

    const slug = input.slug || slugify(input.name);
    await Category.create({
      name: input.name,
      slug,
      parent: input.parentId || null,
      description: input.description,
      imageUrl: input.imageUrl || undefined,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      sortOrder: input.sortOrder,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidatePath("/");
    redirectWithMessage("/admin/categories", "success", "Category created.");
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      redirectWithMessage(
        "/admin/categories",
        "error",
        "A category with that slug already exists."
      );
    }
    if (error instanceof Error) {
      redirectWithMessage("/admin/categories", "error", error.message);
    }
    throw error;
  }
}

export async function updateCategoryAction(formData: FormData) {
  await getAdminActor();

  const id = text(formData, "id");
  let input;
  try {
    input = categoryUpdateSchema.parse({
      id,
      name: text(formData, "name"),
      slug: text(formData, "slug") || undefined,
      parentId: nullableId(formData, "parentId"),
      description: text(formData, "description") || undefined,
      imageUrl: text(formData, "imageUrl"),
      isActive: checkbox(formData, "isActive"),
      isFeatured: checkbox(formData, "isFeatured"),
      sortOrder: numberField(formData, "sortOrder"),
    });
  } catch (error) {
    redirectWithMessage("/admin/categories", "error", zodMessage(error));
  }

  try {
    await connectToDatabase();

    const existing = await Category.findById(id);
    if (!existing) {
      redirectWithMessage("/admin/categories", "error", "Category not found.");
    }

    await assertCategoryParentIntegrity(input.id, input.parentId ?? null);

    if (existing!.isActive && !input.isActive) {
      await assertCategoryCanBeDeactivated(id);
    }

    const slug = input.slug || slugify(input.name);
    existing!.name = input.name;
    existing!.slug = slug;
    existing!.parent = input.parentId
      ? new mongoose.Types.ObjectId(input.parentId)
      : null;
    existing!.description = input.description;
    existing!.imageUrl = input.imageUrl || undefined;
    existing!.isActive = input.isActive;
    existing!.isFeatured = input.isFeatured;
    existing!.sortOrder = input.sortOrder;
    await existing!.save();

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidatePath("/");
    redirectWithMessage("/admin/categories", "success", "Category updated.");
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      redirectWithMessage(
        "/admin/categories",
        "error",
        "A category with that slug already exists."
      );
    }
    if (error instanceof Error) {
      redirectWithMessage("/admin/categories", "error", error.message);
    }
    throw error;
  }
}

export async function archiveCategoryAction(formData: FormData) {
  await getAdminActor();
  const idResult = objectIdSchema.safeParse(text(formData, "id"));
  if (!idResult.success) {
    redirectWithMessage("/admin/categories", "error", "Invalid category identifier.");
  }

  try {
    await connectToDatabase();
    await assertCategoryCanBeDeactivated(idResult.data);
    await Category.findByIdAndUpdate(idResult.data, { isActive: false });
  } catch (error) {
    redirectWithMessage(
      "/admin/categories",
      "error",
      error instanceof Error ? error.message : "Unable to deactivate category."
    );
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/");
  redirectWithMessage("/admin/categories", "success", "Category deactivated.");
}

export async function deleteCategoryAction(formData: FormData) {
  await getAdminActor();

  const idResult = objectIdSchema.safeParse(text(formData, "id"));
  if (!idResult.success) {
    redirectWithMessage("/admin/categories", "error", "Invalid category identifier.");
  }

  try {
    await connectToDatabase();

    const category = await Category.findById(idResult.data).select("_id name isActive");
    if (!category) {
      redirectWithMessage("/admin/categories", "error", "Category not found.");
    }

    const [hasChildren, hasProducts] = await Promise.all([
      Category.exists({ parent: idResult.data }),
      Product.exists({
        $or: [{ category: idResult.data }, { subcategory: idResult.data }],
      }),
    ]);

    if (hasChildren) {
      redirectWithMessage(
        "/admin/categories",
        "error",
        "This category still has child categories. Remove or move them before permanent deletion."
      );
    }

    if (hasProducts) {
      redirectWithMessage(
        "/admin/categories",
        "error",
        "This category is still referenced by products. Move those products to another category before permanent deletion."
      );
    }

    await Category.findByIdAndDelete(idResult.data);

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidatePath("/");
    redirectWithMessage("/admin/categories", "success", "Category deleted permanently.");
  } catch (error) {
    if (error instanceof Error) {
      redirectWithMessage("/admin/categories", "error", error.message);
    }
    throw error;
  }
}

export async function createBrandAction(formData: FormData) {
  await getAdminActor();

  let input;
  try {
    input = brandCreateSchema.parse({
      name: text(formData, "name"),
      slug: text(formData, "slug") || undefined,
      description: text(formData, "description") || undefined,
      logoUrl: text(formData, "logoUrl"),
      website: text(formData, "website"),
      isActive: checkbox(formData, "isActive"),
      sortOrder: numberField(formData, "sortOrder"),
    });
  } catch (error) {
    redirectWithMessage("/admin/brands", "error", zodMessage(error));
  }

  try {
    await connectToDatabase();
    await Brand.create({
      name: input.name,
      slug: input.slug || slugify(input.name),
      description: input.description,
      logoUrl: input.logoUrl || undefined,
      website: input.website || undefined,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    });

    revalidatePath("/admin/brands");
    revalidatePath("/admin/products");
    redirectWithMessage("/admin/brands", "success", "Brand created.");
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      redirectWithMessage("/admin/brands", "error", "A brand with that slug already exists.");
    }
    if (error instanceof Error) {
      redirectWithMessage("/admin/brands", "error", error.message);
    }
    throw error;
  }
}

export async function updateBrandAction(formData: FormData) {
  await getAdminActor();

  const id = text(formData, "id");
  let input;
  try {
    input = brandUpdateSchema.parse({
      id,
      name: text(formData, "name"),
      slug: text(formData, "slug") || undefined,
      description: text(formData, "description") || undefined,
      logoUrl: text(formData, "logoUrl"),
      website: text(formData, "website"),
      isActive: checkbox(formData, "isActive"),
      sortOrder: numberField(formData, "sortOrder"),
    });
  } catch (error) {
    redirectWithMessage("/admin/brands", "error", zodMessage(error));
  }

  try {
    await connectToDatabase();
    const existing = await Brand.findById(input.id);
    if (!existing) {
      redirectWithMessage("/admin/brands", "error", "Brand not found.");
    }

    if (existing!.isActive && !input.isActive) {
      const hasActiveProducts = await Product.exists({
        brand: input.id,
        status: "ACTIVE",
      });
      if (hasActiveProducts) {
        redirectWithMessage(
          "/admin/brands",
          "error",
          "Move active products to another brand before deactivating this brand."
        );
      }
    }

    existing!.name = input.name;
    existing!.slug = input.slug || slugify(input.name);
    existing!.description = input.description;
    existing!.logoUrl = input.logoUrl || undefined;
    existing!.website = input.website || undefined;
    existing!.isActive = input.isActive;
    existing!.sortOrder = input.sortOrder;
    await existing!.save();

    revalidatePath("/admin/brands");
    revalidatePath("/admin/products");
    redirectWithMessage("/admin/brands", "success", "Brand updated.");
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      redirectWithMessage(
        "/admin/brands",
        "error",
        "A brand with that slug already exists."
      );
    }
    if (error instanceof Error) {
      redirectWithMessage("/admin/brands", "error", error.message);
    }
    throw error;
  }
}

export async function archiveBrandAction(formData: FormData) {
  await getAdminActor();
  const idResult = objectIdSchema.safeParse(text(formData, "id"));
  if (!idResult.success) {
    redirectWithMessage("/admin/brands", "error", "Invalid brand identifier.");
  }

  await connectToDatabase();
  const hasActiveProducts = await Product.exists({
    brand: idResult.data,
    status: "ACTIVE",
  });
  if (hasActiveProducts) {
    redirectWithMessage(
      "/admin/brands",
      "error",
      "Move active products to another brand before deactivating this brand."
    );
  }

  await Brand.findByIdAndUpdate(idResult.data, { isActive: false });
  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
  redirectWithMessage("/admin/brands", "success", "Brand deactivated.");
}

export async function createProductAction(formData: FormData) {
  await getAdminActor();

  let input;
  try {
    input = productCreateSchema.parse(productFormPayload(formData));
  } catch (error) {
    redirectWithMessage("/admin/products", "error", zodMessage(error));
  }

  if (input.status === "ACTIVE") {
    redirectWithMessage(
      "/admin/products",
      "error",
      "Create the product as Draft until at least one SKU/variant has been configured."
    );
  }

  try {
    await connectToDatabase();
    await validateProductReferences(
      input.categoryId,
      input.subcategoryId ?? null,
      input.brandId ?? null
    );

    const slug = input.slug || slugify(input.name);
    await Product.create({
      name: input.name,
      slug,
      shortDescription: input.shortDescription,
      description: input.description,
      category: new mongoose.Types.ObjectId(input.categoryId),
      subcategory: input.subcategoryId
        ? new mongoose.Types.ObjectId(input.subcategoryId)
        : null,
      brand: input.brandId ? new mongoose.Types.ObjectId(input.brandId) : null,
      productType: input.productType,
      status: input.status,
      images: input.images,
      attributes: input.attributes,
      searchKeywords: input.searchKeywords,
      tax: {
        hsnCode: input.tax.hsnCode || undefined,
        gstRate: input.tax.gstRate ?? undefined,
        isGstInclusive: input.tax.isGstInclusive,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidatePath("/");
    redirectWithMessage("/admin/products", "success", "Product created.");
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      redirectWithMessage(
        "/admin/products",
        "error",
        "A product with that slug already exists."
      );
    }
    if (error instanceof Error) {
      redirectWithMessage("/admin/products", "error", error.message);
    }
    throw error;
  }
}

export async function updateProductAction(formData: FormData) {
  await getAdminActor();

  const id = text(formData, "id");
  let input;
  try {
    input = productUpdateSchema.parse({
      ...productFormPayload(formData),
      id,
    });
  } catch (error) {
    redirectWithMessage(`/admin/products/${id}`, "error", zodMessage(error));
  }

  try {
    await connectToDatabase();
    const existing = await Product.findById(id);
    if (!existing) {
      redirectWithMessage(`/admin/products/${id}`, "error", "Product not found.");
    }

    if (input.status === "ACTIVE") {
      const hasActiveVariant = await ProductVariant.exists({
        product: id,
        status: "ACTIVE",
      });
      if (!hasActiveVariant) {
        redirectWithMessage(
          `/admin/products/${id}`,
          "error",
          "A product cannot be activated until it has at least one active SKU/variant."
        );
      }
    }

    await validateProductReferences(
      input.categoryId,
      input.subcategoryId ?? null,
      input.brandId ?? null
    );

    existing!.name = input.name;
    existing!.slug = input.slug || slugify(input.name);
    existing!.shortDescription = input.shortDescription;
    existing!.description = input.description;
    existing!.category = new mongoose.Types.ObjectId(input.categoryId);
    existing!.subcategory = input.subcategoryId
      ? new mongoose.Types.ObjectId(input.subcategoryId)
      : null;
    existing!.brand = input.brandId
      ? new mongoose.Types.ObjectId(input.brandId)
      : null;
    existing!.productType = input.productType;
    existing!.status = input.status;
    existing!.statusBeforeVariantArchive = null;
    existing!.images = input.images;
    existing!.attributes = input.attributes;
    existing!.searchKeywords = input.searchKeywords;
    existing!.tax = {
      hsnCode: input.tax.hsnCode || undefined,
      gstRate: input.tax.gstRate ?? undefined,
      isGstInclusive: input.tax.isGstInclusive,
    };

    await existing!.save();

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/admin");
    revalidatePath("/");
    redirectWithMessage(`/admin/products/${id}`, "success", "Product updated.");
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      redirectWithMessage(
        `/admin/products/${id}`,
        "error",
        "A product with that slug already exists."
      );
    }
    if (error instanceof Error) {
      redirectWithMessage(`/admin/products/${id}`, "error", error.message);
    }
    throw error;
  }
}

export async function archiveProductAction(formData: FormData) {
  await getAdminActor();
  const idResult = objectIdSchema.safeParse(text(formData, "id"));
  if (!idResult.success) {
    redirectWithMessage("/admin/products", "error", "Invalid product identifier.");
  }

  await connectToDatabase();
  const product = await Product.findById(idResult.data).select("_id status");
  if (!product) {
    redirectWithMessage("/admin/products", "error", "Product not found.");
  }
  if (product!.status === "ARCHIVED") {
    redirectWithMessage("/admin/products", "error", "Product is already archived.");
  }

  await Product.findByIdAndUpdate(idResult.data, {
    status: "ARCHIVED",
    statusBeforeArchive: product!.status,
    statusBeforeVariantArchive: null,
  });

  const variants = await ProductVariant.find({
    product: idResult.data,
    status: { $ne: "ARCHIVED" },
  }).select("_id status");

  if (variants.length > 0) {
    await ProductVariant.bulkWrite(
      variants.map((variant) => ({
        updateOne: {
          filter: { _id: variant._id },
          update: {
            status: "ARCHIVED",
            statusBeforeArchive: variant.status,
            archivedByProduct: true,
          },
        },
      }))
    );
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${idResult.data}`);
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/");
  redirectWithMessage("/admin/products", "success", "Product archived.");
}

export async function unarchiveProductAction(formData: FormData) {
  await getAdminActor();
  const idResult = objectIdSchema.safeParse(text(formData, "id"));
  if (!idResult.success) {
    redirectWithMessage("/admin/products", "error", "Invalid product identifier.");
  }

  try {
    await connectToDatabase();
    const product = await Product.findById(idResult.data).select(
      "_id status statusBeforeArchive statusBeforeVariantArchive"
    );
    if (!product) {
      redirectWithMessage("/admin/products", "error", "Product not found.");
    }
    if (product!.status !== "ARCHIVED") {
      redirectWithMessage("/admin/products", "error", "Product is not archived.");
    }

    const allArchivedVariants = await ProductVariant.find({
      product: idResult.data,
      status: "ARCHIVED",
    }).select("_id statusBeforeArchive archivedByProduct isDefault");

    const hasStoredProductStatus =
      product!.statusBeforeArchive === "ACTIVE" || product!.statusBeforeArchive === "DRAFT";

    // Older archived products predate status restoration metadata. When metadata is
    // absent, restoring them as Active matches the old "published product" workflow.
    const restoreStatus = hasStoredProductStatus
      ? product!.statusBeforeArchive!
      : allArchivedVariants.length > 0
        ? "ACTIVE"
        : "DRAFT";

    await Product.findByIdAndUpdate(idResult.data, {
      status: restoreStatus,
      statusBeforeArchive: null,
      statusBeforeVariantArchive: null,
    });

    const archivedVariants = allArchivedVariants.filter(
      (variant) => variant.archivedByProduct || !variant.statusBeforeArchive
    );

    if (archivedVariants.length > 0) {
      await ProductVariant.bulkWrite(
        archivedVariants.map((variant) => ({
          updateOne: {
            filter: { _id: variant._id },
            update: {
              status:
                variant.statusBeforeArchive === "INACTIVE" ? "INACTIVE" : "ACTIVE",
              statusBeforeArchive: null,
              archivedByProduct: false,
            },
          },
        }))
      );
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${idResult.data}`);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin");
    revalidatePath("/");
    redirectWithMessage(
      "/admin/products",
      "success",
      `Product unarchived as ${restoreStatus === "ACTIVE" ? "Active" : "Draft"}.`
    );
  } catch (error) {
    if (error instanceof Error) {
      redirectWithMessage("/admin/products", "error", error.message);
    }
    throw error;
  }
}

export async function deleteProductAction(formData: FormData) {
  await getAdminActor();

  const idResult = objectIdSchema.safeParse(text(formData, "id"));
  if (!idResult.success) {
    redirectWithMessage("/admin/products", "error", "Invalid product identifier.");
  }

  try {
    await connectToDatabase();

    const product = await Product.findById(idResult.data).select("_id name status");
    if (!product) {
      redirectWithMessage("/admin/products", "error", "Product not found.");
    }

    if (product!.status !== "ARCHIVED") {
      redirectWithMessage(
        "/admin/products",
        "error",
        "Archive the product first. Only archived products can be permanently deleted."
      );
    }

    const variants = await ProductVariant.find({ product: idResult.data }).select("_id");
    const variantIds = variants.map((variant) => variant._id);

    if (variantIds.length > 0) {
      await InventoryTransaction.deleteMany({ variant: { $in: variantIds } });
      await Inventory.deleteMany({ variant: { $in: variantIds } });
      await ProductVariant.deleteMany({ product: idResult.data });
    }

    await Product.findByIdAndDelete(idResult.data);

    revalidatePath("/admin/products");
    revalidatePath("/admin/products/" + idResult.data);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin");
    revalidatePath("/");
    redirectWithMessage("/admin/products", "success", "Product deleted permanently.");
  } catch (error) {
    if (error instanceof Error) {
      redirectWithMessage("/admin/products", "error", error.message);
    }
    throw error;
  }
}

export async function createVariantAction(formData: FormData) {
  const actor = await getAdminActor();

  let parsed;
  try {
    parsed = variantCreateSchema.parse(variantFormPayload(formData));
  } catch (error) {
    const productId = text(formData, "productId");
    redirectWithMessage(
      `/admin/products/${productId}`,
      "error",
      zodMessage(error)
    );
  }

  try {
    await connectToDatabase();

    const product = await Product.findById(parsed.productId).select("_id status productType");
    if (!product || product.status === "ARCHIVED") {
      redirectWithMessage(
        `/admin/products/${parsed.productId}`,
        "error",
        "Product is unavailable."
      );
    }

    const existingActiveVariantCount = await ProductVariant.countDocuments({
      product: parsed.productId,
      status: { $ne: "ARCHIVED" },
    });

    if (product!.productType === "SIMPLE" && existingActiveVariantCount >= 1) {
      redirectWithMessage(
        `/admin/products/${parsed.productId}`,
        "error",
        "A SIMPLE product can have only one active SKU. Change the product type to VARIABLE to add more variants."
      );
    }

    const isDefault = existingActiveVariantCount === 0;

    const variant = await ProductVariant.create({
      product: new mongoose.Types.ObjectId(parsed.productId),
      sku: parsed.sku,
      title: parsed.title,
      options: parsed.options,
      attributes: parsed.attributes,
      pricePaise: parsed.pricePaise,
      mrpPaise: parsed.mrpPaise,
      unitOfSale: parsed.unitOfSale,
      minOrderQuantity: parsed.minOrderQuantity,
      orderQuantityStep: parsed.orderQuantityStep,
      status: parsed.status,
      trackInventory: parsed.trackInventory,
      isDefault,
      imageUrl: parsed.imageUrl || undefined,
      imageAlt: parsed.imageAlt || undefined,
    });

    const initialQuantity = parsed.trackInventory ? parsed.initialStock : 0;
    const stockStatus =
      !parsed.trackInventory
        ? "IN_STOCK"
        : initialQuantity <= 0
          ? "OUT_OF_STOCK"
          : initialQuantity <= parsed.lowStockThreshold
            ? "LOW_STOCK"
            : "IN_STOCK";

    try {
      await Inventory.create({
        variant: variant._id,
        stockUnit: parsed.unitOfSale,
        availableQuantity: initialQuantity,
        reservedQuantity: 0,
        lowStockThreshold: parsed.lowStockThreshold,
        stockStatus,
        trackInventory: parsed.trackInventory,
        allowBackorder: false,
      });

      if (initialQuantity > 0) {
        await InventoryTransaction.create({
          variant: variant._id,
          type: "INITIAL_STOCK",
          quantityDelta: initialQuantity,
          balanceAfter: initialQuantity,
          reason: "Initial inventory entered with SKU creation",
          performedBy: actor.id,
        });
      }
    } catch (inventoryError) {
      await ProductVariant.deleteOne({ _id: variant._id });
      throw inventoryError;
    }

    revalidatePath(`/admin/products/${parsed.productId}`);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin");

    const createdStatus = !parsed.trackInventory
      ? "available without inventory tracking"
      : initialQuantity <= 0
        ? "currently out of stock"
        : initialQuantity <= parsed.lowStockThreshold
          ? `low stock (${initialQuantity} available)`
          : `in stock (${initialQuantity} available)`;

    redirect(
      `/admin/products/${parsed.productId}?success=${encodeURIComponent(
        `Variant ${parsed.sku} created — ${createdStatus}.`
      )}&createdVariant=${encodeURIComponent(String(variant._id))}#variant-${encodeURIComponent(String(variant._id))}`
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      redirectWithMessage(
        `/admin/products/${parsed.productId}`,
        "error",
        "That SKU already exists. SKU values must be globally unique."
      );
    }
    if (error instanceof Error) {
      redirectWithMessage(
        `/admin/products/${parsed.productId}`,
        "error",
        error.message
      );
    }
    throw error;
  }
}

export async function updateVariantAction(formData: FormData) {
  await getAdminActor();

  const productId = text(formData, "productId");
  let parsed;
  try {
    parsed = variantUpdateSchema.parse(variantFormPayload(formData));
  } catch (error) {
    redirectWithMessage(
      `/admin/products/${productId}`,
      "error",
      zodMessage(error)
    );
  }

  try {
    await connectToDatabase();

    const variant = await ProductVariant.findOne({
      _id: parsed.id,
      product: parsed.productId,
    });
    if (!variant) {
      redirectWithMessage(
        `/admin/products/${productId}`,
        "error",
        "Variant not found."
      );
    }

    const parentProduct = await Product.findById(parsed.productId).select(
      "_id status"
    );

    if (
      parentProduct?.status === "ACTIVE" &&
      variant!.status === "ACTIVE" &&
      parsed.status !== "ACTIVE"
    ) {
      const otherActiveVariants = await ProductVariant.countDocuments({
        product: parsed.productId,
        status: "ACTIVE",
        _id: { $ne: variant!._id },
      });

      if (otherActiveVariants === 0) {
        redirectWithMessage(
          `/admin/products/${productId}`,
          "error",
          "An active product must keep at least one active SKU."
        );
      }
    }

    if (parsed.status === "ARCHIVED") {
      redirectWithMessage(
        `/admin/products/${productId}`,
        "error",
        "Use the archive action so the default SKU and inventory lifecycle are handled safely."
      );
    }

    variant!.sku = parsed.sku;
    variant!.title = parsed.title;
    variant!.options = parsed.options;
    variant!.attributes = parsed.attributes;
    variant!.pricePaise = parsed.pricePaise;
    variant!.mrpPaise = parsed.mrpPaise;
    variant!.unitOfSale = parsed.unitOfSale;
    variant!.minOrderQuantity = parsed.minOrderQuantity;
    variant!.orderQuantityStep = parsed.orderQuantityStep;
    variant!.status = parsed.status;
    variant!.statusBeforeArchive = null;
    variant!.archivedByProduct = false;
    variant!.trackInventory = parsed.trackInventory;
    variant!.imageUrl = parsed.imageUrl || undefined;
    variant!.imageAlt = parsed.imageAlt || undefined;

    await variant!.save();

    const inventory = await Inventory.findOne({ variant: variant!._id });
    if (inventory) {
      inventory.stockUnit = parsed.unitOfSale;
      inventory.trackInventory = parsed.trackInventory;
      inventory.lowStockThreshold = parsed.lowStockThreshold;

      if (!parsed.trackInventory) {
        inventory.stockStatus = "IN_STOCK";
      } else {
        inventory.stockStatus =
          inventory.availableQuantity <= 0
            ? "OUT_OF_STOCK"
            : inventory.availableQuantity <= inventory.lowStockThreshold
              ? "LOW_STOCK"
              : "IN_STOCK";
      }

      await inventory.save();
    }

    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin");
    redirectWithMessage(`/admin/products/${productId}`, "success", "Variant updated.");
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      redirectWithMessage(
        `/admin/products/${productId}`,
        "error",
        "That SKU already exists. SKU values must be globally unique."
      );
    }
    if (error instanceof Error) {
      redirectWithMessage(`/admin/products/${productId}`, "error", error.message);
    }
    throw error;
  }
}

export async function archiveVariantAction(formData: FormData) {
  await getAdminActor();
  const id = text(formData, "id");
  const productId = text(formData, "productId");
  const idResult = objectIdSchema.safeParse(id);
  if (!idResult.success) {
    redirectWithMessage(`/admin/products/${productId}`, "error", "Invalid variant identifier.");
  }

  await connectToDatabase();
  const variant = await ProductVariant.findOne({
    _id: idResult.data,
    product: productId,
  });
  if (!variant) {
    redirectWithMessage(`/admin/products/${productId}`, "error", "Variant not found.");
  }
  if (variant!.status === "ARCHIVED") {
    redirectWithMessage(`/admin/products/${productId}`, "error", "Variant is already archived.");
  }

  await ProductVariant.findByIdAndUpdate(idResult.data, {
    status: "ARCHIVED",
    statusBeforeArchive: variant!.status,
    archivedByProduct: false,
    isDefault: false,
  });

  if (variant!.isDefault) {
    const replacement = await ProductVariant.findOne({
      product: productId,
      status: { $ne: "ARCHIVED" },
      _id: { $ne: idResult.data },
    }).sort({ createdAt: 1 });

    if (replacement) {
      await ProductVariant.findByIdAndUpdate(replacement._id, { isDefault: true });
    }
  }

  const remainingActiveVariants = await ProductVariant.countDocuments({
    product: productId,
    status: "ACTIVE",
  });

  if (remainingActiveVariants === 0) {
    const product = await Product.findById(productId).select("status");
    if (product?.status === "ACTIVE") {
      await Product.findByIdAndUpdate(productId, {
        status: "DRAFT",
        statusBeforeVariantArchive: "ACTIVE",
      });
    }
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  redirectWithMessage(`/admin/products/${productId}`, "success", "Variant archived.");
}

export async function unarchiveVariantAction(formData: FormData) {
  await getAdminActor();
  const id = text(formData, "id");
  const productId = text(formData, "productId");
  const idResult = objectIdSchema.safeParse(id);
  if (!idResult.success) {
    redirectWithMessage(`/admin/products/${productId}`, "error", "Invalid variant identifier.");
  }

  try {
    await connectToDatabase();
    const variant = await ProductVariant.findOne({
      _id: idResult.data,
      product: productId,
    });
    if (!variant) {
      redirectWithMessage(`/admin/products/${productId}`, "error", "Variant not found.");
    }
    if (variant!.status !== "ARCHIVED") {
      redirectWithMessage(`/admin/products/${productId}`, "error", "Variant is not archived.");
    }

    const restoreStatus = variant!.statusBeforeArchive === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    await ProductVariant.findByIdAndUpdate(idResult.data, {
      status: restoreStatus,
      statusBeforeArchive: null,
      archivedByProduct: false,
    });

    const hasDefaultActiveVariant = await ProductVariant.exists({
      product: productId,
      status: "ACTIVE",
      isDefault: true,
    });
    if (restoreStatus === "ACTIVE" && !hasDefaultActiveVariant) {
      await ProductVariant.updateMany({ product: productId }, { isDefault: false });
      await ProductVariant.findByIdAndUpdate(idResult.data, { isDefault: true });
    }

    if (restoreStatus === "ACTIVE") {
      const product = await Product.findById(productId).select(
        "_id status statusBeforeVariantArchive"
      );
      if (
        product?.status === "DRAFT" &&
        product.statusBeforeVariantArchive === "ACTIVE"
      ) {
        await Product.findByIdAndUpdate(productId, {
          status: "ACTIVE",
          statusBeforeVariantArchive: null,
        });
      }
    }

    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin");
    revalidatePath("/");
    redirectWithMessage(`/admin/products/${productId}`, "success", "Variant unarchived.");
  } catch (error) {
    if (error instanceof Error) {
      redirectWithMessage(`/admin/products/${productId}`, "error", error.message);
    }
    throw error;
  }
}
export async function setInventoryStockAction(formData: FormData) {
  const actor = await getAdminActor();
  const requestedReturnPath = text(formData, "returnPath");
  const safeReturnPath = /^\/admin\/products\/[a-fA-F0-9]{24}$/.test(requestedReturnPath)
    ? requestedReturnPath
    : "/admin/inventory";

  let input;
  try {
    input = inventorySetSchema.parse({
      variantId: text(formData, "variantId"),
      availableQuantity: numberField(formData, "availableQuantity"),
      reason: text(formData, "reason"),
    });
  } catch (error) {
    redirectWithMessage(safeReturnPath, "error", zodMessage(error));
  }

  await connectToDatabase();

  const inventory = await Inventory.findOne({ variant: input.variantId });
  if (!inventory) {
    redirectWithMessage(safeReturnPath, "error", "Inventory record not found.");
  }

  if (!inventory!.trackInventory) {
    redirectWithMessage(
      safeReturnPath,
      "error",
      "Inventory tracking is disabled for this SKU."
    );
  }

  const currentQuantity = inventory!.availableQuantity;
  const nextQuantity = input.availableQuantity;
  const quantityDelta = nextQuantity - currentQuantity;

  if (quantityDelta === 0) {
    redirectWithMessage(
      safeReturnPath,
      "error",
      "The new stock quantity is the same as the current quantity."
    );
  }

  inventory!.availableQuantity = nextQuantity;
  inventory!.stockStatus =
    nextQuantity <= 0
      ? "OUT_OF_STOCK"
      : nextQuantity <= inventory!.lowStockThreshold
        ? "LOW_STOCK"
        : "IN_STOCK";

  await inventory!.save();

  await InventoryTransaction.create({
    variant: input.variantId,
    type: "CORRECTION",
    quantityDelta,
    balanceAfter: nextQuantity,
    reason: input.reason,
    performedBy: actor.id,
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(safeReturnPath);
  revalidatePath("/");
  redirectWithMessage(safeReturnPath, "success", `Stock updated to ${nextQuantity}.`);
}

export async function adjustInventoryAction(formData: FormData) {
  const actor = await getAdminActor();
  const requestedReturnPath = text(formData, "returnPath");
  const safeReturnPath = /^\/admin\/products\/[a-fA-F0-9]{24}$/.test(requestedReturnPath)
    ? requestedReturnPath
    : "/admin/inventory";

  let input;
  try {
    input = inventoryAdjustmentSchema.parse({
      variantId: text(formData, "variantId"),
      quantityDelta: numberField(formData, "quantityDelta"),
      reason: text(formData, "reason"),
    });
  } catch (error) {
    redirectWithMessage(safeReturnPath, "error", zodMessage(error));
  }

  await connectToDatabase();

  const inventory = await Inventory.findOne({ variant: input.variantId });
  if (!inventory) {
    redirectWithMessage(safeReturnPath, "error", "Inventory record not found.");
  }

  if (!inventory!.trackInventory) {
    redirectWithMessage(
      safeReturnPath,
      "error",
      "Inventory tracking is disabled for this SKU."
    );
  }

  const nextQuantity = inventory!.availableQuantity + input.quantityDelta;
  if (nextQuantity < 0) {
    redirectWithMessage(
      "/admin/inventory",
      "error",
      "Stock cannot be reduced below zero."
    );
  }

  inventory!.availableQuantity = nextQuantity;
  inventory!.stockStatus =
    nextQuantity <= 0
      ? "OUT_OF_STOCK"
      : nextQuantity <= inventory!.lowStockThreshold
        ? "LOW_STOCK"
        : "IN_STOCK";

  await inventory!.save();

  await InventoryTransaction.create({
    variant: input.variantId,
    type: "MANUAL_ADJUSTMENT",
    quantityDelta: input.quantityDelta,
    balanceAfter: nextQuantity,
    reason: input.reason,
    performedBy: actor.id,
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(safeReturnPath);
  redirectWithMessage(safeReturnPath, "success", "Inventory adjusted.");
}
