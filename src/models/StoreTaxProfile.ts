import mongoose, { Document, Model, Schema } from "mongoose";

export type TaxRegistrationStatus = "REGISTERED" | "UNREGISTERED";

export interface IStoreTaxProfile extends Document {
  key: "default";
  registrationStatus: TaxRegistrationStatus;
  legalName: string;
  tradeName?: string;
  gstin?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  stateCode: string;
  phone?: string;
  email?: string;
  invoicePrefix: string;
  reverseChargeApplicable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StoreTaxProfileSchema = new Schema<IStoreTaxProfile>(
  {
    key: {
      type: String,
      enum: ["default"],
      unique: true,
      required: true,
      default: "default",
    },
    registrationStatus: {
      type: String,
      enum: ["REGISTERED", "UNREGISTERED"],
      required: true,
      default: "UNREGISTERED",
    },
    legalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    tradeName: {
      type: String,
      trim: true,
      maxlength: 180,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 15,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    stateCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 15,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    invoicePrefix: {
      type: String,
      trim: true,
      uppercase: true,
      required: true,
      default: "INV",
      maxlength: 3,
    },
    reverseChargeApplicable: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

export const StoreTaxProfile: Model<IStoreTaxProfile> =
  mongoose.models.StoreTaxProfile ||
  mongoose.model<IStoreTaxProfile>("StoreTaxProfile", StoreTaxProfileSchema);

export const DEFAULT_STORE_TAX_PROFILE = {
  key: "default" as const,
  registrationStatus: "UNREGISTERED" as const,
  legalName: "",
  tradeName: "",
  gstin: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  stateCode: "",
  phone: "",
  email: "",
  invoicePrefix: "INV",
  reverseChargeApplicable: false,
};
