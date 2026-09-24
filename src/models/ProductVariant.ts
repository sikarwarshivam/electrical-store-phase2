import mongoose, { Document, Model, Schema } from "mongoose";
import {
  ProductAttribute,
  UnitOfSale,
  VariantOption,
  VariantStatus,
} from "@/types/catalog";

const VariantOptionSchema = new Schema<VariantOption>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    value: { type: String, required: true, trim: true, maxlength: 120 },
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

export interface IProductVariant extends Document {
  _id: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  sku: string;
  title?: string;
  options: VariantOption[];
  attributes: ProductAttribute[];
  pricePaise: number;
  mrpPaise: number;
  unitOfSale: UnitOfSale;
  minOrderQuantity: number;
  orderQuantityStep: number;
  status: VariantStatus;
  statusBeforeArchive?: Exclude<VariantStatus, "ARCHIVED"> | null;
  archivedByProduct: boolean;
  isDefault: boolean;
  trackInventory: boolean;
  imageUrl?: string;
  imageAlt?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: 100,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    options: {
      type: [VariantOptionSchema],
      default: [],
    },
    attributes: {
      type: [ProductAttributeSchema],
      default: [],
    },
    pricePaise: {
      type: Number,
      required: true,
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    },
    mrpPaise: {
      type: Number,
      required: true,
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    },
    unitOfSale: {
      type: String,
      enum: [
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
      ],
      default: "PIECE",
      index: true,
    },
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: Number.EPSILON,
      max: 1_000_000,
    },
    orderQuantityStep: {
      type: Number,
      default: 1,
      min: Number.EPSILON,
      max: 1_000_000,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },
    statusBeforeArchive: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", null],
      default: null,
    },
    archivedByProduct: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    trackInventory: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
    },
    imageAlt: {
      type: String,
      trim: true,
      maxlength: 160,
    },
  },
  { timestamps: true }
);

ProductVariantSchema.index({ product: 1, status: 1 });
ProductVariantSchema.index({ product: 1, sku: 1 });
ProductVariantSchema.index({ product: 1, createdAt: -1 });
ProductVariantSchema.index({ "options.name": 1, "options.value": 1, status: 1 });
ProductVariantSchema.index({ "attributes.key": 1, "attributes.value": 1, status: 1 });

ProductVariantSchema.pre("validate", function validatePriceOrder() {
  if (this.mrpPaise < this.pricePaise) {
    this.invalidate("mrpPaise", "MRP must be greater than or equal to selling price");
  }
});

export const ProductVariant: Model<IProductVariant> =
  mongoose.models.ProductVariant ||
  mongoose.model<IProductVariant>("ProductVariant", ProductVariantSchema);
