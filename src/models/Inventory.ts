import mongoose, { Document, Model, Schema } from "mongoose";
import { StockStatus, UnitOfSale } from "@/types/catalog";

export interface IInventory extends Document {
  _id: mongoose.Types.ObjectId;
  variant: mongoose.Types.ObjectId;
  stockUnit: UnitOfSale;
  availableQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  stockStatus: StockStatus;
  trackInventory: boolean;
  allowBackorder: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    variant: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
      unique: true,
      index: true,
    },
    stockUnit: {
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
    },
    availableQuantity: {
      type: Number,
      default: 0,
      min: 0,
      max: 1_000_000_000,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0,
      max: 1_000_000_000,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
      max: 1_000_000,
    },
    stockStatus: {
      type: String,
      enum: ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"],
      default: "OUT_OF_STOCK",
      index: true,
    },
    trackInventory: {
      type: Boolean,
      default: true,
    },
    allowBackorder: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

InventorySchema.index({ stockStatus: 1, updatedAt: -1 });

export const Inventory: Model<IInventory> =
  mongoose.models.Inventory ||
  mongoose.model<IInventory>("Inventory", InventorySchema);
