import { z } from "zod";

export const storeTaxProfileSchema = z
  .object({
    registrationStatus: z.enum(["REGISTERED", "UNREGISTERED"]),
    legalName: z.string().trim().min(2, "Legal business name is required.").max(180),
    tradeName: z.string().trim().max(180).optional().or(z.literal("")),
    gstin: z.string().trim().toUpperCase().optional().or(z.literal("")),
    addressLine1: z.string().trim().min(3, "Business address is required.").max(200),
    addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
    city: z.string().trim().min(2, "Business city is required.").max(100),
    state: z.string().trim().min(2, "Business state is required.").max(100),
    stateCode: z.string().trim().regex(/^\d{2}$/, "State code must contain 2 digits."),
    phone: z.string().trim().max(15).optional().or(z.literal("")),
    email: z.string().trim().email("Enter a valid business email.").max(254).optional().or(z.literal("")),
    invoicePrefix: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{1,3}$/, "Invoice prefix must be 1–3 letters or numbers."),
    reverseChargeApplicable: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.registrationStatus === "REGISTERED") {
      const gstin = value.gstin;
      if (!gstin || !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["gstin"],
          message: "Enter a valid 15-character GSTIN.",
        });
      } else if (gstin.slice(0, 2) !== value.stateCode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stateCode"],
          message: "Business state code must match the first two digits of the GSTIN.",
        });
      }
    }
  });

export type StoreTaxProfileInput = z.infer<typeof storeTaxProfileSchema>;
