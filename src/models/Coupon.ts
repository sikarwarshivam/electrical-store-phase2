import mongoose, { Document, Model, Schema } from "mongoose";

export type CouponDiscountType = "PERCENTAGE" | "FLAT";

export interface ICoupon extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderValuePaise: number;
  startsAt: Date;
  expiresAt: Date;
  usageLimit: number;
  usedCount: number;
  reservedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 40,
      match: /^[A-Z0-9][A-Z0-9_-]*$/,
      index: true,
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FLAT"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    },
    minOrderValuePaise: {
      type: Number,
      required: true,
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      default: 0,
    },
    startsAt: { type: Date, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usageLimit: {
      type: Number,
      required: true,
      integer: true,
      min: 0,
      max: 1_000_000,
      default: 0,
    },
    reservedCount: {
      type: Number,
      required: true,
      integer: true,
      min: 0,
      max: 1_000_000,
      default: 0,
    },
    usedCount: {
      type: Number,
      required: true,
      integer: true,
      min: 0,
      max: 1_000_000,
      default: 0,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

CouponSchema.index({ code: 1, isActive: 1 });
CouponSchema.index({ isActive: 1, startsAt: 1, expiresAt: 1 });

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);
