"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { connectToDatabase } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { Brand } from "@/models/Brand";
import { Category } from "@/models/Category";
import { Inventory } from "@/models/Inventory";
import { Product } from "@/models/Product";
import { ProductVariant } from "@/models/ProductVariant";
import { Campaign } from "@/models/Campaign";
import { campaignCreateSchema, campaignIdSchema, campaignUpdateSchema } from "@/schemas/campaign";
import type { PublicProductCard } from "@/lib/catalog";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function checkbox(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function numberField(formData: FormData, key: string): number {
  const raw = text(formData, key);
  if (raw === "") return 0;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > 10000) {
    throw new Error("Display order must be a whole number from 0 to 10,000.");
  }
  return value;
}

function dateValue(value: string, label: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(label + " must be a valid date and time.");
  }
  return parsed;
}

function selectedProductIds(formData: FormData): string[] {
  return Array.from(
    new Set(
      formData
        .getAll("productIds")
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function redirectWithMessage(
  path: string,
  key: "success" | "error",
  message: string
): never {
  redirect(path + "?" + key + "=" + encodeURIComponent(message));
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

async function validateProducts(ids: string[]) {
  if (
    ids.length < 1 ||
    ids.length > 24 ||
    ids.some((id) => !mongoose.Types.ObjectId.isValid(id))
  ) {
    throw new Error("Select between 1 and 24 valid products.");
  }

  const products = await Product.find({
    _id: { $in: ids },
    status: "ACTIVE",
  })
    .select("_id")
    .lean();

  const existing = new Set(products.map((product) => String(product._id)));
  if (products.length !== ids.length || ids.some((id) => !existing.has(id))) {
    throw new Error("Every selected campaign product must be active.");
  }

  return ids.map((id) => new mongoose.Types.ObjectId(id));
}

async function parseCampaignInput(formData: FormData, update: boolean) {
  const raw = {
    ...(update ? { campaignId: text(formData, "campaignId") } : {}),
    name: text(formData, "name"),
    slug: text(formData, "slug") || undefined,
    subtitle: text(formData, "subtitle") || undefined,
    description: text(formData, "description") || undefined,
    imageUrl: text(formData, "imageUrl"),
    startsAt: text(formData, "startsAt"),
    expiresAt: text(formData, "expiresAt"),
    productIds: selectedProductIds(formData),
    sortOrder: numberField(formData, "sortOrder"),
    isActive: checkbox(formData, "isActive"),
  };

  const parsed = update
    ? campaignUpdateSchema.safeParse(raw)
    : campaignCreateSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message || "Please check the campaign details."
    );
  }

  const startsAt = dateValue(parsed.data.startsAt, "Start date");
  const expiresAt = dateValue(parsed.data.expiresAt, "Expiry date");

  if (expiresAt <= startsAt) {
    throw new Error("Expiry date must be later than the start date.");
  }

  return {
    ...parsed.data,
    slug: parsed.data.slug || slugify(parsed.data.name),
    startsAt,
    expiresAt,
    productIds: await validateProducts(parsed.data.productIds),
  };
}

export async function getAdminCampaigns() {
  await requireAdmin("/admin/campaigns");
  await connectToDatabase();

  const campaigns = await Campaign.find({})
    .sort({ isActive: -1, sortOrder: 1, expiresAt: 1, createdAt: -1 })
    .lean();

  return { campaigns, now: Date.now() };
}

export async function getAdminCampaign(campaignId: string) {
  await requireAdmin("/admin/campaigns");

  const parsed = campaignIdSchema.safeParse(campaignId);
  if (!parsed.success) return null;

  await connectToDatabase();
  return Campaign.findById(parsed.data).lean();
}

export async function createCampaignAction(formData: FormData) {
  await requireAdmin("/admin/campaigns");

  let errorMessage: string | null = null;

  try {
    await connectToDatabase();
    await Campaign.create(await parseCampaignInput(formData, false));

    revalidatePath("/admin/campaigns");
    revalidatePath("/campaigns");
    revalidatePath("/");
  } catch (error) {
    errorMessage = isDuplicateKeyError(error)
      ? "A campaign with that slug already exists."
      : error instanceof Error
        ? error.message
        : "Unable to create campaign.";
  }

  if (errorMessage) {
    redirectWithMessage("/admin/campaigns", "error", errorMessage);
  }

  redirectWithMessage(
    "/admin/campaigns",
    "success",
    "Festival campaign created."
  );
}

export async function updateCampaignAction(formData: FormData) {
  await requireAdmin("/admin/campaigns");

  const campaignId = text(formData, "campaignId");
  const returnPath = "/admin/campaigns/" + encodeURIComponent(campaignId);
  let errorMessage: string | null = null;

  try {
    await connectToDatabase();
    const input = await parseCampaignInput(formData, true);
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      throw new Error("Campaign not found.");
    }

    const previousSlug = campaign.slug;

    campaign.name = input.name;
    campaign.slug = input.slug;
    campaign.subtitle = input.subtitle;
    campaign.description = input.description;
    campaign.imageUrl = input.imageUrl;
    campaign.startsAt = input.startsAt;
    campaign.expiresAt = input.expiresAt;
    campaign.productIds = input.productIds;
    campaign.sortOrder = input.sortOrder;
    campaign.isActive = input.isActive;
    await campaign.save();

    revalidatePath("/admin/campaigns");
    revalidatePath(returnPath);
    revalidatePath("/campaigns");
    revalidatePath("/campaigns/" + previousSlug);
    revalidatePath("/campaigns/" + input.slug);
    revalidatePath("/");
  } catch (error) {
    errorMessage = isDuplicateKeyError(error)
      ? "A campaign with that slug already exists."
      : error instanceof Error
        ? error.message
        : "Unable to update campaign.";
  }

  if (errorMessage) {
    redirectWithMessage(returnPath, "error", errorMessage);
  }

  redirectWithMessage(
    "/admin/campaigns",
    "success",
    "Festival campaign updated."
  );
}

export async function toggleCampaignAction(formData: FormData) {
  await requireAdmin("/admin/campaigns");

  const parsed = campaignIdSchema.safeParse(text(formData, "campaignId"));
  if (!parsed.success) {
    redirectWithMessage(
      "/admin/campaigns",
      "error",
      "Invalid campaign identifier."
    );
  }

  await connectToDatabase();
  const campaign = await Campaign.findById(parsed.data);

  if (!campaign) {
    redirectWithMessage("/admin/campaigns", "error", "Campaign not found.");
  }

  campaign!.isActive = !campaign!.isActive;
  await campaign!.save();

  revalidatePath("/admin/campaigns");
  revalidatePath("/campaigns");
  revalidatePath("/campaigns/" + campaign!.slug);
  revalidatePath("/");

  redirectWithMessage(
    "/admin/campaigns",
    "success",
    "Campaign " + (campaign!.isActive ? "activated." : "deactivated.")
  );
}

export async function deleteCampaignAction(formData: FormData) {
  await requireAdmin("/admin/campaigns");

  const parsed = campaignIdSchema.safeParse(text(formData, "campaignId"));
  if (!parsed.success) {
    redirectWithMessage(
      "/admin/campaigns",
      "error",
      "Invalid campaign identifier."
    );
  }

  await connectToDatabase();
  const campaign = await Campaign.findById(parsed.data).select(
    "_id name slug"
  );

  if (!campaign) {
    redirectWithMessage("/admin/campaigns", "error", "Campaign not found.");
  }

  await Campaign.findByIdAndDelete(parsed.data);

  revalidatePath("/admin/campaigns");
  revalidatePath("/campaigns");
  revalidatePath("/campaigns/" + campaign!.slug);
  revalidatePath("/");

  redirectWithMessage(
    "/admin/campaigns",
    "success",
    'Campaign "' + campaign!.name + '" deleted.'
  );
}

type CampaignProduct = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  shortDescription?: string;
  images: Array<{
    url: string;
    alt?: string;
    isPrimary?: boolean;
    sortOrder?: number;
  }>;
  productType: "SIMPLE" | "VARIABLE";
  category?: { name?: string; slug?: string } | null;
  brand?: { name?: string; slug?: string } | null;
};

type CampaignVariant = {
  _id: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  pricePaise: number;
  mrpPaise: number;
  trackInventory: boolean;
  isDefault: boolean;
};

type CampaignInventory = {
  variant: mongoose.Types.ObjectId;
  availableQuantity: number;
  lowStockThreshold: number;
};

function stockStatus(
  trackInventory: boolean,
  availableQuantity: number,
  lowStockThreshold: number
): PublicProductCard["stockStatus"] {
  if (!trackInventory) return "IN_STOCK";
  if (availableQuantity <= 0) return "OUT_OF_STOCK";
  if (availableQuantity <= lowStockThreshold) return "LOW_STOCK";
  return "IN_STOCK";
}

function campaignProductCard(
  product: CampaignProduct,
  variants: CampaignVariant[],
  inventoryMap: Map<string, CampaignInventory>
): PublicProductCard | null {
  if (variants.length === 0) return null;

  const rows = variants.map((variant) => {
    const inventory = inventoryMap.get(String(variant._id));
    return {
      pricePaise: variant.pricePaise,
      mrpPaise: variant.mrpPaise,
      stockStatus: stockStatus(
        variant.trackInventory,
        inventory?.availableQuantity ?? 0,
        inventory?.lowStockThreshold ?? 5
      ),
      isDefault: variant.isDefault,
    };
  });

  const defaultVariant = rows.find((variant) => variant.isDefault) || rows[0];
  const lowestPrice = Math.min(...rows.map((variant) => variant.pricePaise));
  const lowestPriceVariant =
    rows.find((variant) => variant.pricePaise === lowestPrice) ||
    defaultVariant;

  const hasStock = rows.some(
    (variant) => variant.stockStatus === "IN_STOCK"
  );
  const hasLowStock = rows.some(
    (variant) => variant.stockStatus === "LOW_STOCK"
  );

  return {
    id: String(product._id),
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription || undefined,
    images: product.images.map((image) => ({
      url: image.url,
      alt: image.alt || product.name,
      isPrimary: Boolean(image.isPrimary),
      sortOrder: image.sortOrder ?? 0,
    })),
    category: {
      name: product.category?.name || "Electrical",
      slug: product.category?.slug || "",
    },
    brand:
      product.brand?.name && product.brand.slug
        ? { name: product.brand.name, slug: product.brand.slug }
        : undefined,
    isVariable: product.productType === "VARIABLE",
    pricePaise: lowestPriceVariant?.pricePaise ?? lowestPrice,
    mrpPaise:
      product.productType === "SIMPLE"
        ? (defaultVariant?.mrpPaise ?? lowestPrice)
        : (lowestPriceVariant?.mrpPaise ?? lowestPrice),
    stockStatus: hasStock
      ? "IN_STOCK"
      : hasLowStock
        ? "LOW_STOCK"
        : "OUT_OF_STOCK",
    variantCount: rows.length,
  };
}

export async function getActiveCampaigns() {
  await connectToDatabase();

  const now = new Date();

  return Campaign.find({
    isActive: true,
    startsAt: { $lte: now },
    expiresAt: { $gt: now },
  })
    .select("_id name slug subtitle imageUrl startsAt expiresAt")
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(12)
    .lean();
}

export async function getPublicCampaignBySlug(slug: string) {
  await connectToDatabase();

  const now = new Date();
  const campaign = await Campaign.findOne({
    slug,
    isActive: true,
    startsAt: { $lte: now },
    expiresAt: { $gt: now },
  }).lean();

  if (!campaign) return null;

  const products = (await Product.find({
    _id: { $in: campaign.productIds },
    status: "ACTIVE",
  })
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .lean()) as unknown as CampaignProduct[];

  const productMap = new Map(
    products.map((product) => [String(product._id), product])
  );

  const orderedProducts = campaign.productIds
    .map((id) => productMap.get(String(id)))
    .filter((product): product is CampaignProduct => Boolean(product));

  const variants = (await ProductVariant.find({
    product: { $in: orderedProducts.map((product) => product._id) },
    status: "ACTIVE",
  }).lean()) as unknown as CampaignVariant[];

  const inventories = (await Inventory.find({
    variant: { $in: variants.map((variant) => variant._id) },
  }).lean()) as unknown as CampaignInventory[];

  const inventoryMap = new Map(
    inventories.map((inventory) => [String(inventory.variant), inventory])
  );

  const variantsByProduct = new Map<string, CampaignVariant[]>();

  for (const variant of variants) {
    const key = String(variant.product);
    const list = variantsByProduct.get(key) || [];
    list.push(variant);
    variantsByProduct.set(key, list);
  }

  const publicProducts = orderedProducts
    .map((product) =>
      campaignProductCard(
        product,
        variantsByProduct.get(String(product._id)) || [],
        inventoryMap
      )
    )
    .filter((product): product is PublicProductCard => Boolean(product));

  return {
    id: String(campaign._id),
    name: campaign.name,
    slug: campaign.slug,
    subtitle: campaign.subtitle || "",
    description: campaign.description || "",
    imageUrl: campaign.imageUrl,
    startsAt: campaign.startsAt,
    expiresAt: campaign.expiresAt,
    products: publicProducts,
  };
}
