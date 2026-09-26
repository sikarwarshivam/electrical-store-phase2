import { z } from "zod";

const objectIdPattern = /^[a-f\d]{24}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const campaignIdSchema = z.string().regex(objectIdPattern, "Invalid campaign identifier.");

export const campaignCreateSchema = z.object({
  name: z.string().trim().min(2, "Campaign name is required.").max(140),
  slug: z.string().trim().max(160).regex(slugPattern, "Slug may only contain lowercase letters, numbers, and hyphens").optional(),
  subtitle: z.string().trim().max(220).optional(),
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().trim().url().max(2048, "Campaign image URL is too long."),
  startsAt: z.string().trim().min(1, "Start date is required."),
  expiresAt: z.string().trim().min(1, "Expiry date is required."),
  productIds: z.array(z.string().regex(objectIdPattern, "Invalid product identifier.")).min(1, "Select at least one product.").max(24, "A campaign can contain at most 24 products."),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  isActive: z.boolean().default(true),
});

export const campaignUpdateSchema = campaignCreateSchema.extend({
  campaignId: campaignIdSchema,
});

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;
