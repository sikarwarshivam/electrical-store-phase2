import { z } from "zod";

export const addressLabelSchema = z.enum(["HOME", "WORK", "OTHER"]);

export const savedAddressSchema = z.object({
  label: addressLabelSchema.default("HOME"),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  pincode: z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit pincode"),
  house: z.string().trim().min(1).max(200),
  street: z.string().trim().min(2).max(240),
  landmark: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  isDefault: z.boolean().default(false),
});

export const updateSavedAddressSchema = savedAddressSchema.extend({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid address id"),
});

export const deleteSavedAddressSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid address id"),
});

export type SavedAddressInput = z.infer<typeof savedAddressSchema>;
