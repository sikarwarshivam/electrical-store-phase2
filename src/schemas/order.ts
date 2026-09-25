import { z } from "zod";
import { objectIdSchema, positiveQuantitySchema } from "@/schemas/catalog";

export const checkoutAddressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name is required")
    .max(120, "Full name is too long")
    .regex(/^[\p{L} .'’-]+$/u, "Full name contains unsupported characters"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(254)
    .optional()
    .or(z.literal("")),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Please enter a valid 6-digit pincode"),
  house: z.string().trim().min(1, "House / Flat is required").max(200),
  street: z.string().trim().min(2, "Street / Locality is required").max(240),
  landmark: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required").max(100),
  state: z.string().trim().min(2, "State is required").max(100),
});

const checkoutCartItemSchema = z.object({
  variantId: objectIdSchema,
  quantity: positiveQuantitySchema,
  unitPricePaise: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
});

export const createPaymentOrderSchema = z.object({
  checkoutId: z
    .string()
    .trim()
    .min(10, "Invalid checkout identifier")
    .max(100),
  items: z.array(checkoutCartItemSchema).min(1).max(100),
  address: checkoutAddressSchema,
});

export const verifyPaymentSchema = z.object({
  orderId: objectIdSchema,
  razorpayPaymentId: z.string().trim().min(5).max(100),
  razorpaySignature: z.string().trim().min(20).max(200),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

export const adminOrderStatusSchema = z.object({
  orderId: objectIdSchema,
  status: z.enum([
    "CONFIRMED",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ]),
  note: z
    .string()
    .trim()
    .max(300, "Status note is too long")
    .optional()
    .or(z.literal("")),
});

export type AdminOrderStatusInput = z.infer<typeof adminOrderStatusSchema>;
