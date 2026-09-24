import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Brand } from "@/models/Brand";
import { Category } from "@/models/Category";
import { Inventory } from "@/models/Inventory";
import { Product } from "@/models/Product";
import { ProductVariant } from "@/models/ProductVariant";

export async function getCatalogDashboardStats() {
  await connectToDatabase();

  const [products, activeProducts, variants, lowStock, categories, brands] =
    await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: "ACTIVE" }),
      ProductVariant.countDocuments({ status: { $ne: "ARCHIVED" } }),
      Inventory.countDocuments({
        $expr: {
          $and: [
            { $eq: ["$trackInventory", true] },
            { $gt: ["$availableQuantity", 0] },
            { $lte: ["$availableQuantity", "$lowStockThreshold"] },
          ],
        },
      }),
      Category.countDocuments({ isActive: true }),
      Brand.countDocuments({ isActive: true }),
    ]);

  return { products, activeProducts, variants, lowStock, categories, brands };
}

export async function getAdminCategories() {
  await connectToDatabase();

  return Category.find({})
    .sort({ parent: 1, sortOrder: 1, name: 1 })
    .lean();
}

export async function getAdminBrands() {
  await connectToDatabase();

  return Brand.find({}).sort({ sortOrder: 1, name: 1 }).lean();
}

export async function getAdminProducts(limit = 50) {
  await connectToDatabase();

  return Product.find({})
    .populate("category", "name slug")
    .populate("subcategory", "name slug")
    .populate("brand", "name slug")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function getAdminProductById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  await connectToDatabase();

  const [product, variants] = await Promise.all([
    Product.findById(id)
      .populate("category", "name slug parent")
      .populate("subcategory", "name slug parent")
      .populate("brand", "name slug")
      .lean(),
    ProductVariant.find({ product: id })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  if (!product) {
    return null;
  }

  const variantIds = variants.map((variant) => variant._id);
  const inventory = await Inventory.find({ variant: { $in: variantIds } }).lean();

  return { product, variants, inventory };
}

export async function getInventoryRows(limit = 100) {
  await connectToDatabase();

  return Inventory.find({})
    .populate({
      path: "variant",
      select: "sku product title pricePaise mrpPaise unitOfSale status",
      populate: { path: "product", select: "name slug" },
    })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
}

export async function getInventoryTransactions(variantId: string, limit = 20) {
  if (!mongoose.Types.ObjectId.isValid(variantId)) return [];

  const { InventoryTransaction } = await import("@/models/InventoryTransaction");
  await connectToDatabase();

  return InventoryTransaction.find({ variant: variantId })
    .populate("performedBy", "name email")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
