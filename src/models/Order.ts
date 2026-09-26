import mongoose, { Document, Model, Schema } from "mongoose";
import { UnitOfSale } from "@/types/catalog";

export type OrderStatus =
  | "PAYMENT_PENDING"
  | "PLACED"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED"
  | "RETURNED"
  | "REFUNDED";

export type OrderPaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "REFUNDED";

export type OrderPaymentMethod = "RAZORPAY";

export type ReservationStatus =
  | "ACTIVE"
  | "RELEASED"
  | "CONSUMED";

export interface IOrderStatusHistoryEntry {
  status: OrderStatus;
  changedAt: Date;
  note?: string;
  changedBy?: mongoose.Types.ObjectId;
}

export interface IOrderAddress {
  fullName: string;
  phone: string;
  email?: string;
  pincode: string;
  house: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
}

export interface IOrderCustomer {
  userId?: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
}

export interface IOrderLine {
  product: mongoose.Types.ObjectId;
  variant: mongoose.Types.ObjectId;
  sku: string;
  productName: string;
  variantTitle?: string;
  imageUrl?: string;
  unitOfSale: UnitOfSale;
  quantity: number;
  unitPricePaise: number;
  mrpPaise: number;
  subtotalPaise: number;
  hsnCode?: string;
  gstRate?: number;
  taxIncluded: boolean;
  taxPaise: number;
  lineTotalPaise: number;
}

export interface IOrderPricing {
  currency: "INR";
  subtotalPaise: number;
  discountPaise: number;
  couponCode?: string;
  shippingPaise: number;
  taxPaise: number;
  taxIncludedPaise: number;
  taxAddedPaise: number;
  grandTotalPaise: number;
}

export interface IOrderPayment {
  method: OrderPaymentMethod;
  status: OrderPaymentStatus;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewayRefundId?: string;
  refundStatus?: "PENDING" | "PROCESSED" | "FAILED";
  refundAmountPaise?: number;
  refundRequestedAt?: Date;
  refundedAt?: Date;
  refundFailureDescription?: string;
  signatureVerifiedAt?: Date;
  webhookVerifiedAt?: Date;
  failedAt?: Date;
  failureCode?: string;
  failureDescription?: string;
}

export interface IOrderReservation {
  status: ReservationStatus;
  reservedAt: Date;
  expiresAt: Date;
  releasedAt?: Date;
  consumedAt?: Date;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  checkoutId: string;
  customer: IOrderCustomer;
  shippingAddress: IOrderAddress;
  items: IOrderLine[];
  pricing: IOrderPricing;
  status: OrderStatus;
  statusHistory: IOrderStatusHistoryEntry[];
  payment: IOrderPayment;
  reservation: IOrderReservation;
  processedWebhookEventIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderStatusHistorySchema = new Schema<IOrderStatusHistoryEntry>(
  {
    status: {
      type: String,
      enum: [
        "PAYMENT_PENDING",
        "PLACED",
        "CONFIRMED",
        "PACKED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "FAILED",
        "RETURNED",
        "REFUNDED",
      ],
      required: true,
    },
    changedAt: { type: Date, required: true, default: Date.now },
    note: { type: String, trim: true, maxlength: 300 },
    changedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const OrderAddressSchema = new Schema<IOrderAddress>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 10 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    pincode: { type: String, required: true, trim: true, maxlength: 6 },
    house: { type: String, required: true, trim: true, maxlength: 200 },
    street: { type: String, required: true, trim: true, maxlength: 240 },
    landmark: { type: String, trim: true, maxlength: 160 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
  },
  { _id: false }
);

const OrderCustomerSchema = new Schema<IOrderCustomer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 10, index: true },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
  },
  { _id: false }
);

const OrderLineSchema = new Schema<IOrderLine>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: Schema.Types.ObjectId, ref: "ProductVariant", required: true },
    sku: { type: String, required: true, trim: true, maxlength: 100 },
    productName: { type: String, required: true, trim: true, maxlength: 180 },
    variantTitle: { type: String, trim: true, maxlength: 160 },
    imageUrl: { type: String, trim: true, maxlength: 2048 },
    unitOfSale: { type: String, required: true },
    quantity: { type: Number, required: true, min: Number.EPSILON, max: 1_000_000 },
    unitPricePaise: { type: Number, required: true, min: 0, max: Number.MAX_SAFE_INTEGER },
    mrpPaise: { type: Number, required: true, min: 0, max: Number.MAX_SAFE_INTEGER },
    subtotalPaise: { type: Number, required: true, min: 0, max: Number.MAX_SAFE_INTEGER },
    hsnCode: { type: String, trim: true, maxlength: 20 },
    gstRate: { type: Number, min: 0, max: 100 },
    taxIncluded: { type: Boolean, required: true, default: true },
    taxPaise: { type: Number, required: true, min: 0, max: Number.MAX_SAFE_INTEGER },
    lineTotalPaise: { type: Number, required: true, min: 0, max: Number.MAX_SAFE_INTEGER },
  },
  { _id: false }
);

const OrderPricingSchema = new Schema<IOrderPricing>(
  {
    currency: { type: String, enum: ["INR"], default: "INR", required: true },
    subtotalPaise: { type: Number, required: true, min: 0, max: Number.MAX_SAFE_INTEGER },
    discountPaise: { type: Number, required: true, min: 0, max: Number.MAX_SAFE_INTEGER },
    couponCode: { type: String, trim: true, uppercase: true, maxlength: 40 },
    shippingPaise: { type: Number, required: true, min: 0, max: Number.MAX_SAFE_INTEGER },
    taxPaise: { type: Number, required: true, min: 0, max: Number.MAX_SAFE_INTEGER },
    taxIncludedPaise: { type: Number, required: true, min: 0, max: Number.MAX_SAFE_INTEGER },
    taxAddedPaise: { type: Number, required: true, min: 0, max: Number.MAX_SAFE_INTEGER },
    grandTotalPaise: { type: Number, required: true, min: 0, max: Number.MAX_SAFE_INTEGER },
  },
  { _id: false }
);

const OrderPaymentSchema = new Schema<IOrderPayment>(
  {
    method: { type: String, enum: ["RAZORPAY"], required: true },
    status: {
      type: String,
      enum: ["PENDING", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED"],
      required: true,
      default: "PENDING",
    },
    gatewayOrderId: { type: String, trim: true, maxlength: 100 },
    gatewayPaymentId: { type: String, trim: true, maxlength: 100 },
    gatewayRefundId: { type: String, trim: true, maxlength: 100 },
    refundStatus: {
      type: String,
      enum: ["PENDING", "PROCESSED", "FAILED"],
    },
    refundAmountPaise: {
      type: Number,
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    },
    refundRequestedAt: { type: Date },
    refundedAt: { type: Date },
    refundFailureDescription: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    signatureVerifiedAt: { type: Date },
    webhookVerifiedAt: { type: Date },
    failedAt: { type: Date },
    failureCode: { type: String, trim: true, maxlength: 100 },
    failureDescription: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const OrderReservationSchema = new Schema<IOrderReservation>(
  {
    status: { type: String, enum: ["ACTIVE", "RELEASED", "CONSUMED"], required: true, default: "ACTIVE" },
    reservedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
    releasedAt: { type: Date },
    consumedAt: { type: Date },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 40,
      index: true,
    },
    checkoutId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    customer: {
      type: OrderCustomerSchema,
      required: true,
    },
    shippingAddress: {
      type: OrderAddressSchema,
      required: true,
    },
    items: {
      type: [OrderLineSchema],
      required: true,
      validate: {
        validator: (items: IOrderLine[]) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },
    pricing: {
      type: OrderPricingSchema,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "PAYMENT_PENDING",
        "PLACED",
        "CONFIRMED",
        "PACKED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "FAILED",
        "RETURNED",
        "REFUNDED",
      ],
      required: true,
      default: "PAYMENT_PENDING",
      index: true,
    },
    statusHistory: {
      type: [OrderStatusHistorySchema],
      default: [],
    },
    payment: {
      type: OrderPaymentSchema,
      required: true,
    },
    reservation: {
      type: OrderReservationSchema,
      required: true,
    },
    processedWebhookEventIds: {
      type: [{ type: String, trim: true, maxlength: 150 }],
      default: [],
    },
  },
  { timestamps: true }
);

OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ "customer.userId": 1, createdAt: -1 });
OrderSchema.index({ "customer.phone": 1, createdAt: -1 });
OrderSchema.index({ "payment.gatewayOrderId": 1 }, { unique: true, sparse: true });
OrderSchema.index({ checkoutId: 1 }, { unique: true });

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
