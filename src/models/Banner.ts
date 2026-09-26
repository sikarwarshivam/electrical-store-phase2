import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBanner extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl: string;
  startsAt: Date;
  expiresAt: Date;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: 180,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    linkUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    startsAt: {
      type: Date,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      required: true,
      integer: true,
      min: 0,
      max: 10000,
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

BannerSchema.index({
  isActive: 1,
  startsAt: 1,
  expiresAt: 1,
  sortOrder: 1,
});

export const Banner: Model<IBanner> =
  mongoose.models.Banner || mongoose.model<IBanner>("Banner", BannerSchema);
