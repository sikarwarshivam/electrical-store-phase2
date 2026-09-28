import mongoose, { Document, Model, Schema } from "mongoose";

export interface IInvoiceCounter extends Document {
  financialYear: string;
  sequence: number;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceCounterSchema = new Schema<IInvoiceCounter>(
  {
    financialYear: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 5,
    },
    sequence: {
      type: Number,
      required: true,
      min: 0,
      max: 9_999_999,
      default: 0,
    },
  },
  { timestamps: true }
);

export const InvoiceCounter: Model<IInvoiceCounter> =
  mongoose.models.InvoiceCounter ||
  mongoose.model<IInvoiceCounter>("InvoiceCounter", InvoiceCounterSchema);
