import { z } from "zod";

export const wishlistProductSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid product id"),
});

export type WishlistProductInput = z.infer<typeof wishlistProductSchema>;
