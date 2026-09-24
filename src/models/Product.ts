import mongoose, { Document, Model, Schema } from "mongoose";
import { ProductAttribute, ProductImage, ProductStatus, ProductType, TaxConfig } from "@/types/catalog";

const ProductImageSchema = new Schema<ProductImage>(
  {
    url: { type: String, required: true, trim: true, maxlength: 2048 },
    publicId: { type: String, trim: true, maxlength: 255 },
    alt: { type: String, default: "", trim: true, maxlength: 160 },
    sortOrder: { type: Number, default: 0, min: 0, max: 10000 },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const ProductAttributeSchema = new Schema<ProductAttribute>(
  {
    key: { type: String, required: true, trim: true, maxlength: 80 },
    label: { type: String, required: true, trim: true, maxlength: 120 },
    value: { type: Schema.Types.Mixed, required: true },
    unit: { type: String, trim: true, maxlength: 30 },
    group: { type: String, trim: true, maxlength: 80 },
    sortOrder: { type: Number, default: 0, min: 0, max: 10000 },
  },
  { _id: false }
);

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  category: mongoose.Types.ObjectId;
  subcategory?: mongoose.Types.ObjectId | null;
  brand?: mongoose.Types.ObjectId | null;
  productType: ProductType;
  status: ProductStatus;
  images: ProductImage[];
  attributes: ProductAttribute[];
  searchKeywords: string[];
  tax: TaxConfig;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 180,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
      index: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      default: null,
      index: true,
    },
    productType: {
      type: String,
      enum: ["SIMPLE", "VARIABLE"],
      default: "SIMPLE",
      index: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    images: {
      type: [ProductImageSchema],
      default: [],
    },
    attributes: {
      type: [ProductAttributeSchema],
      default: [],
    },
    searchKeywords: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 80 }],
      default: [],
    },
    tax: {
      hsnCode: { type: String, trim: true, maxlength: 20 },
      gstRate: { type: Number, min: 0, max: 100 },
      isGstInclusive: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ subcategory: 1, status: 1 });
ProductSchema.index({ brand: 1, status: 1 });
ProductSchema.index({ status: 1, createdAt: -1 });
ProductSchema.index({ "attributes.key": 1, "attributes.value": 1, status: 1 });
ProductSchema.index({
  name: "text",
  shortDescription: "text",
  description: "text",
  searchKeywords: "text",
});

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
