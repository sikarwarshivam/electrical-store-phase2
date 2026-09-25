import mongoose, { Document, Model, Schema } from "mongoose";

export type InventoryTransactionType =
  | "INITIAL_STOCK"
  | "MANUAL_ADJUSTMENT"
  | "RESERVATION"
  | "RELEASE"
  | "SALE"
  | "RETURN"
  | "CORRECTION";

export interface IInventoryTransaction extends Document {
  _id: mongoose.Types.ObjectId;
  variant: mongoose.Types.ObjectId;
  type: InventoryTransactionType;
  quantityDelta: number;
  balanceAfter: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  performedBy?: mongoose.Types.ObjectId;
  reservedDelta?: number;
  reservedAfter?: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    variant: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "INITIAL_STOCK",
        "MANUAL_ADJUSTMENT",
        "RESERVATION",
        "RELEASE",
        "SALE",
        "RETURN",
        "CORRECTION",
      ],
      required: true,
      index: true,
    },
    quantityDelta: {
      type: Number,
      required: true,
      min: -1_000_000_000,
      max: 1_000_000_000,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
      max: 1_000_000_000,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    referenceType: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    referenceId: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    reservedDelta: {
      type: Number,
      min: -1_000_000_000,
      max: 1_000_000_000,
    },
    reservedAfter: {
      type: Number,
      min: 0,
      max: 1_000_000_000,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

InventoryTransactionSchema.index({ variant: 1, createdAt: -1 });
InventoryTransactionSchema.index({ performedBy: 1, createdAt: -1 });

export const InventoryTransaction: Model<IInventoryTransaction> =
  mongoose.models.InventoryTransaction ||
  mongoose.model<IInventoryTransaction>("InventoryTransaction", InventoryTransactionSchema);
