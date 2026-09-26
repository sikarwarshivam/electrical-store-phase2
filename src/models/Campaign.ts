import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICampaign extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  startsAt: Date;
  expiresAt: Date;
  productIds: mongoose.Types.ObjectId[];
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160, index: true },
    subtitle: { type: String, trim: true, maxlength: 220 },
    description: { type: String, trim: true, maxlength: 2000 },
    imageUrl: { type: String, required: true, trim: true, maxlength: 2048 },
    startsAt: { type: Date, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    productIds: {
      type: [Schema.Types.ObjectId],
      ref: "Product",
      required: true,
      validate: {
        validator: (value: mongoose.Types.ObjectId[]) =>
          Array.isArray(value) && value.length > 0 && value.length <= 24,
        message: "A campaign must contain between 1 and 24 products.",
      },
    },
    sortOrder: { type: Number, required: true, integer: true, min: 0, max: 10000, default: 0 },
    isActive: { type: Boolean, required: true, default: true, index: true },
  },
  { timestamps: true }
);

CampaignSchema.index({ isActive: 1, startsAt: 1, expiresAt: 1, sortOrder: 1 });

export const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>("Campaign", CampaignSchema);
