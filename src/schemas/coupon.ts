import { z } from "zod";

const moneySchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid amount with up to two decimals.");

export const couponCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "Coupon code must be at least 3 characters.")
    .max(40, "Coupon code is too long.")
    .regex(
      /^[A-Z0-9][A-Z0-9_-]*$/,
      "Coupon code can contain only letters, numbers, hyphens, and underscores."
    ),
  discountType: z.enum(["PERCENTAGE", "FLAT"]),
  discountValue: z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid discount value."),
  minOrderValue: moneySchema,
  startsAt: z.string().trim().min(1, "Start date is required."),
  expiresAt: z.string().trim().min(1, "Expiry date is required."),
  usageLimit: z
    .string()
    .trim()
    .regex(/^\d+$/, "Usage limit must be a whole number."),
  isActive: z.enum(["on", "off"]).default("on"),
});

export const couponUpdateSchema = couponCreateSchema.extend({
  couponId: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid coupon identifier."),
});

export type CouponCreateInput = z.infer<typeof couponCreateSchema>;
export type CouponUpdateInput = z.infer<typeof couponUpdateSchema>;

export const couponIdSchema = z.object({
  couponId: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid coupon identifier."),
});
