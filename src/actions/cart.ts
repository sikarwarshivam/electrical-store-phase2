"use server";

import mongoose from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Brand } from "@/models/Brand";
import { Category } from "@/models/Category";
import { Inventory } from "@/models/Inventory";
import { Product } from "@/models/Product";
import { ProductVariant } from "@/models/ProductVariant";

const reconcileItemSchema = z.object({
  variantId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid variant identifier"),
  quantity: z.number().finite().positive().max(1_000_000),
  unitPricePaise: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
});

const reconcileCartSchema = z.object({
  items: z.array(reconcileItemSchema).max(100),
});

type ReconcileInput = z.infer<typeof reconcileCartSchema>;

export interface CartReconcileLine {
  variantId: string;
  productId?: string;
  productSlug?: string;
  sku?: string;
  title?: string;
  unitPricePaise?: number;
  mrpPaise?: number;
  unitOfSale?: string;
  image?: string;
  brand?: string;
  quantity: number;
  minOrderQuantity?: number;
  orderQuantityStep?: number;
  trackInventory?: boolean;
  availableQuantity?: number;
  stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  purchasable: boolean;
  priceChanged: boolean;
  issues: string[];
}

export interface CartReconcileResult {
  success: true;
  lines: CartReconcileLine[];
  subtotalPaise: number;
  issues: Array<{ variantId: string; message: string }>;
}

function getStockStatus(
  trackInventory: boolean,
  availableQuantity: number,
  lowStockThreshold: number
): "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" {
  if (!trackInventory) return "IN_STOCK";
  if (availableQuantity <= 0) return "OUT_OF_STOCK";
  if (availableQuantity <= lowStockThreshold) return "LOW_STOCK";
  return "IN_STOCK";
}

function quantityFits(quantity: number, minimum: number, step: number) {
  if (quantity < minimum) return false;
  const ratio = (quantity - minimum) / step;
  return Math.abs(ratio - Math.round(ratio)) < 1e-9;
}

export async function reconcileCartAction(
  input: ReconcileInput
): Promise<CartReconcileResult> {
  const parsed = reconcileCartSchema.parse(input);
  await connectToDatabase();

  const uniqueItems = Array.from(
    new Map(parsed.items.map((item) => [item.variantId, item])).values()
  );

  if (uniqueItems.length === 0) {
    return { success: true, lines: [], subtotalPaise: 0, issues: [] };
  }

  const variantIds = uniqueItems.map(
    (item) => new mongoose.Types.ObjectId(item.variantId)
  );

  const variants = await ProductVariant.find({
    _id: { $in: variantIds },
  })
    .select(
      "_id product sku title pricePaise mrpPaise unitOfSale minOrderQuantity orderQuantityStep status trackInventory imageUrl"
    )
    .lean();

  const variantMap = new Map(
    variants.map((variant) => [String(variant._id), variant])
  );

  const productIds = variants.map((variant) => variant.product);

  const products = await Product.find({
    _id: { $in: productIds },
  })
    .select("_id name slug category subcategory brand status images")
    .lean();

  const productMap = new Map(
    products.map((product) => [String(product._id), product])
  );

  const categoryIds = [
    ...products.map((product) => product.category),
    ...products.flatMap((product) =>
      product.subcategory ? [product.subcategory] : []
    ),
  ];

  const brandIds = products.flatMap((product) =>
    product.brand ? [product.brand] : []
  );

  const [categories, brands, inventories] = await Promise.all([
    Category.find({
      _id: { $in: categoryIds },
      isActive: true,
    })
      .select("_id")
      .lean(),
    brandIds.length
      ? Brand.find({
          _id: { $in: brandIds },
          isActive: true,
        })
          .select("_id name")
          .lean()
      : [],
    Inventory.find({
      variant: { $in: variantIds },
    })
      .select("variant availableQuantity lowStockThreshold trackInventory")
      .lean(),
  ]);

  const activeCategories = new Set(
    categories.map((category) => String(category._id))
  );
  const activeBrands = new Map(
    brands.map((brand) => [String(brand._id), brand.name])
  );
  const inventoryMap = new Map(
    inventories.map((inventory) => [String(inventory.variant), inventory])
  );

  const lines: CartReconcileLine[] = [];
  const issues: Array<{ variantId: string; message: string }> = [];
  let subtotalPaise = 0;

  for (const item of uniqueItems) {
    const variant = variantMap.get(item.variantId);

    if (!variant) {
      const message = "This SKU is no longer available.";
      lines.push({
        variantId: item.variantId,
        quantity: item.quantity,
        purchasable: false,
        priceChanged: false,
        issues: [message],
      });
      issues.push({ variantId: item.variantId, message });
      continue;
    }

    const product = productMap.get(String(variant.product));
    const lineIssues: string[] = [];

    if (!product || product.status !== "ACTIVE") {
      lineIssues.push("This product is no longer available.");
    } else {
      if (!activeCategories.has(String(product.category))) {
        lineIssues.push("This product category is no longer available.");
      }

      if (
        product.subcategory &&
        !activeCategories.has(String(product.subcategory))
      ) {
        lineIssues.push("This product subcategory is no longer available.");
      }

      if (
        product.brand &&
        !activeBrands.has(String(product.brand))
      ) {
        lineIssues.push("This product brand is no longer available.");
      }
    }

    if (variant.status !== "ACTIVE") {
      lineIssues.push("This SKU is no longer available.");
    }

    const inventory = inventoryMap.get(item.variantId);
    const trackInventory =
      inventory?.trackInventory ?? variant.trackInventory;
    const availableQuantity = inventory?.availableQuantity ?? 0;
    const lowStockThreshold = inventory?.lowStockThreshold ?? 5;
    const currentStockStatus = getStockStatus(
      trackInventory,
      availableQuantity,
      lowStockThreshold
    );

    if (
      !quantityFits(
        item.quantity,
        variant.minOrderQuantity,
        variant.orderQuantityStep
      )
    ) {
      lineIssues.push(
        "Quantity must be at least " +
          variant.minOrderQuantity +
          " and follow increments of " +
          variant.orderQuantityStep +
          "."
      );
    }

    if (trackInventory && availableQuantity < item.quantity) {
      lineIssues.push(
        availableQuantity <= 0
          ? "This SKU is currently out of stock."
          : "Only " +
              availableQuantity +
              " unit(s) are currently available."
      );
    }

    const priceChanged = item.unitPricePaise !== variant.pricePaise;

    const primaryImage =
      variant.imageUrl ||
      product?.images?.find((image) => image.isPrimary)?.url ||
      product?.images?.[0]?.url;

    const title = variant.title
      ? (product?.name || "Product") + " — " + variant.title
      : product?.name;

    const purchasable = lineIssues.length === 0;

    if (purchasable) {
      subtotalPaise += variant.pricePaise * item.quantity;
    }

    const line: CartReconcileLine = {
      variantId: item.variantId,
      productId: product ? String(product._id) : undefined,
      productSlug: product?.slug,
      sku: variant.sku,
      title,
      unitPricePaise: variant.pricePaise,
      mrpPaise: variant.mrpPaise,
      unitOfSale: variant.unitOfSale,
      image: primaryImage,
      brand: product?.brand
        ? activeBrands.get(String(product.brand))
        : undefined,
      quantity: item.quantity,
      minOrderQuantity: variant.minOrderQuantity,
      orderQuantityStep: variant.orderQuantityStep,
      trackInventory,
      availableQuantity,
      stockStatus: currentStockStatus,
      purchasable,
      priceChanged,
      issues: lineIssues,
    };

    lines.push(line);

    for (const message of lineIssues) {
      issues.push({ variantId: item.variantId, message });
    }
  }

  return {
    success: true,
    lines,
    subtotalPaise,
    issues,
  };
}
