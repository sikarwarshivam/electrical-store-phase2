import { z } from "zod";

const bannerLinkSchema = z
  .string()
  .trim()
  .min(1, "Banner link is required.")
  .max(2048, "Banner link is too long.")
  .refine(
    (value) => value.startsWith("/") || /^https?:\/\//i.test(value),
    "Banner link must be an internal path or an http(s) URL."
  );

const bannerImageUrlSchema = z
  .string()
  .trim()
  .min(1, "Banner image URL is required.")
  .max(2048, "Banner image URL is too long.")
  .refine(
    (value) => /^https?:\/\//i.test(value),
    "Banner image must use an http(s) URL."
  );

export const bannerCreateSchema = z.object({
  title: z.string().trim().min(1, "Banner title is required.").max(100),
  subtitle: z.string().trim().max(180, "Banner subtitle is too long."),
  imageUrl: bannerImageUrlSchema,
  linkUrl: bannerLinkSchema,
  startsAt: z.string().trim().min(1, "Start date is required."),
  expiresAt: z.string().trim().min(1, "Expiry date is required."),
  sortOrder: z.string().trim().regex(/^\d+$/, "Display order must be a whole number."),
  isActive: z.enum(["on", "off"]).default("on"),
});

export const bannerUpdateSchema = bannerCreateSchema.extend({
  bannerId: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid banner identifier."),
});

export const bannerIdSchema = z.object({
  bannerId: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid banner identifier."),
});

export type BannerCreateInput = z.infer<typeof bannerCreateSchema>;
export type BannerUpdateInput = z.infer<typeof bannerUpdateSchema>;
