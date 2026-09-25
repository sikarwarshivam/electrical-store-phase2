"use server";

import mongoose from "mongoose";
import { getCurrentUser, requireAuth } from "@/lib/auth-utils";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { ProductVariant } from "@/models/ProductVariant";
import { Inventory } from "@/models/Inventory";
import { Wishlist } from "@/models/Wishlist";
import { wishlistProductSchema } from "@/schemas/wishlist";

export async function toggleWishlistAction(input: unknown) {
  const parsed = wishlistProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid product." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false as const, error: "Please sign in to use your wishlist.", requiresLogin: true as const };
  }

  if (!mongoose.Types.ObjectId.isValid(user.id)) {
    return { success: false as const, error: "Your account session is invalid." };
  }

  await connectToDatabase();

  const product = await Product.findOne({
    _id: parsed.data.productId,
    status: "ACTIVE",
  })
    .select("_id")
    .lean();

  if (!product) {
    return { success: false as const, error: "This product is no longer available." };
  }

  const existing = await Wishlist.findOne({
    user: user.id,
    product: product._id,
  });

  if (existing) {
    await existing.deleteOne();
    return { success: true as const, wishlisted: false };
  }

  await Wishlist.create({
    user: new mongoose.Types.ObjectId(user.id),
    product: product._id,
  });

  return { success: true as const, wishlisted: true };
}

export async function getProductWishlistState(productId: string) {
  const user = await getCurrentUser();
  if (
    !user?.id ||
    !mongoose.Types.ObjectId.isValid(user.id) ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    return false;
  }

  await connectToDatabase();

  return Boolean(
    await Wishlist.exists({
      user: user.id,
      product: productId,
    })
  );
}

export async function getWishlistItems() {
  const user = await requireAuth("/account/wishlist");
  if (!mongoose.Types.ObjectId.isValid(user.id)) return [];

  await connectToDatabase();

  const entries = await Wishlist.find({ user: user.id })
    .sort({ createdAt: -1 })
    .populate(
      "product",
      "_id name slug shortDescription images status productType"
    )
    .lean();

  const productIds = entries
    .map((entry) =>
      entry.product && typeof entry.product === "object"
        ? entry.product._id
        : null
    )
    .filter(Boolean) as mongoose.Types.ObjectId[];

  if (productIds.length === 0) return [];

  const variants = await ProductVariant.find({
    product: { $in: productIds },
    status: "ACTIVE",
  })
    .sort({ isDefault: -1, pricePaise: 1 })
    .lean();

  const variantIds = variants.map((variant) => variant._id);
  const inventories = variantIds.length
    ? await Inventory.find({ variant: { $in: variantIds } })
        .select("variant availableQuantity lowStockThreshold trackInventory")
        .lean()
    : [];

  const inventoryMap = new Map(
    inventories.map((inventory) => [inventory.variant.toString(), inventory])
  );

  const variantsByProduct = new Map<string, typeof variants>();
  for (const variant of variants) {
    const key = variant.product.toString();
    const list = variantsByProduct.get(key) || [];
    list.push(variant);
    variantsByProduct.set(key, list);
  }

  return entries.flatMap((entry) => {
    const product =
      entry.product && typeof entry.product === "object"
        ? entry.product
        : null;

    if (!product) return [];

    const productVariants = variantsByProduct.get(product._id.toString()) || [];
    const defaultVariant =
      productVariants.find((variant) => variant.isDefault) ||
      productVariants[0];

    if (!defaultVariant) {
      return [
        {
          id: entry._id.toString(),
          productId: product._id.toString(),
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription || "",
          imageUrl: product.images?.find((image) => image.isPrimary)?.url ||
            product.images?.[0]?.url ||
            "",
          productType: product.productType,
          available: false,
          variantId: "",
          sku: "",
          pricePaise: 0,
          unitOfSale: "PIECE",
          availableQuantity: 0,
          trackInventory: true,
          minOrderQuantity: 1,
          orderQuantityStep: 1,
        },
      ];
    }

    const inventory = inventoryMap.get(defaultVariant._id.toString());
    const available =
      defaultVariant.trackInventory === false
        ? true
        : (inventory?.availableQuantity ?? 0) > 0;

    return [
      {
        id: entry._id.toString(),
        productId: product._id.toString(),
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription || "",
        imageUrl:
          defaultVariant.imageUrl ||
          product.images?.find((image) => image.isPrimary)?.url ||
          product.images?.[0]?.url ||
          "",
        productType: product.productType,
        available,
        variantId: defaultVariant._id.toString(),
        sku: defaultVariant.sku,
        pricePaise: defaultVariant.pricePaise,
        unitOfSale: defaultVariant.unitOfSale,
        availableQuantity: inventory?.availableQuantity ?? 0,
        trackInventory: defaultVariant.trackInventory,
        minOrderQuantity: defaultVariant.minOrderQuantity,
        orderQuantityStep: defaultVariant.orderQuantityStep,
      },
    ];
  });
}

export async function removeWishlistItemAction(input: unknown) {
  const parsed = wishlistProductSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid product." };

  const user = await requireAuth("/account/wishlist");
  if (!mongoose.Types.ObjectId.isValid(user.id)) {
    return { success: false as const, error: "Your account session is invalid." };
  }

  await connectToDatabase();

  await Wishlist.deleteOne({
    user: user.id,
    product: parsed.data.productId,
  });

  return { success: true as const };
}
