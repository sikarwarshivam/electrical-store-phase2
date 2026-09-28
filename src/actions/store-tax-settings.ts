"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-utils";
import { connectToDatabase } from "@/lib/db";
import { StoreTaxProfile, DEFAULT_STORE_TAX_PROFILE } from "@/models/StoreTaxProfile";
import { storeTaxProfileSchema } from "@/schemas/store-tax-settings";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function redirectWithError(message: string): never {
  redirect("/admin/settings?error=" + encodeURIComponent(message));
}

export async function getStoreTaxProfile() {
  await connectToDatabase();
  const profile = await StoreTaxProfile.findOne({ key: "default" }).lean();
  if (!profile) return DEFAULT_STORE_TAX_PROFILE;
  return {
    ...DEFAULT_STORE_TAX_PROFILE,
    ...profile,
    id: profile._id.toString(),
  };
}

export async function updateStoreTaxProfileAction(formData: FormData) {
  await requireAdmin("/admin/settings");

  const parsed = storeTaxProfileSchema.safeParse({
    registrationStatus:
      formData.get("registrationStatus") === "REGISTERED"
        ? "REGISTERED"
        : "UNREGISTERED",
    legalName: value(formData, "legalName"),
    tradeName: value(formData, "tradeName"),
    gstin: value(formData, "gstin"),
    addressLine1: value(formData, "addressLine1"),
    addressLine2: value(formData, "addressLine2"),
    city: value(formData, "city"),
    state: value(formData, "state"),
    stateCode: value(formData, "stateCode"),
    phone: value(formData, "phone"),
    email: value(formData, "email"),
    invoicePrefix: value(formData, "invoicePrefix") || "INV",
    reverseChargeApplicable: formData.get("reverseChargeApplicable") === "on",
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message || "Invalid GST / invoicing settings.");
  }

  try {
    await connectToDatabase();
    await StoreTaxProfile.findOneAndUpdate(
      { key: "default" },
      { $set: { key: "default", ...parsed.data } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    revalidatePath("/admin/settings");
    revalidatePath("/checkout");
    revalidatePath("/account/orders");
    redirect("/admin/settings?success=" + encodeURIComponent("GST / invoicing settings saved."));
  } catch (error) {
    redirectWithError(
      error instanceof Error ? error.message : "Unable to save GST / invoicing settings."
    );
  }
}
