import mongoose, { Document, Model, Schema } from "mongoose";

export type AddressLabel = "HOME" | "WORK" | "OTHER";

export interface IAddress extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  label: AddressLabel;
  fullName: string;
  phone: string;
  pincode: string;
  house: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: {
      type: String,
      enum: ["HOME", "WORK", "OTHER"],
      required: true,
      default: "HOME",
    },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 10 },
    pincode: { type: String, required: true, trim: true, maxlength: 6 },
    house: { type: String, required: true, trim: true, maxlength: 200 },
    street: { type: String, required: true, trim: true, maxlength: 240 },
    landmark: { type: String, trim: true, maxlength: 160 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    isDefault: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

AddressSchema.index({ user: 1, createdAt: -1 });
AddressSchema.index({ user: 1, isDefault: 1 });

export const Address: Model<IAddress> =
  mongoose.models.Address || mongoose.model<IAddress>("Address", AddressSchema);
