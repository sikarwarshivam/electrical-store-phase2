import { z } from "zod";

const moneyRupeesSchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid amount with up to two decimals.");

const distanceSchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid distance.");

export const storeDeliverySettingsSchema = z.object({
  freeAboveOrderValue: moneyRupeesSchema,
  slab1ToKm: distanceSchema,
  slab1Fee: moneyRupeesSchema,
  slab2ToKm: distanceSchema,
  slab2Fee: moneyRupeesSchema,
  slab3ToKm: distanceSchema,
  slab3Fee: moneyRupeesSchema,
  courierFlatFee: moneyRupeesSchema,
  codEnabled: z.enum(["on", "off"]).default("off"),
  codMinOrderValue: moneyRupeesSchema,
  codMaxOrderValue: moneyRupeesSchema,
  codConvenienceFee: moneyRupeesSchema,
});

export type StoreDeliverySettingsInput = z.infer<
  typeof storeDeliverySettingsSchema
>;
