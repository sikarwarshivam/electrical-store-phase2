"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { connectToDatabase } from "@/lib/db";
import { parseMoneyToPaise } from "@/lib/money";
import {
  DEFAULT_STORE_SETTINGS,
  StoreSettings,
} from "@/models/StoreSettings";
import { storeDeliverySettingsSchema } from "@/schemas/store-settings";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function errorRedirect(message: string): never {
  redirect("/admin/settings?error=" + encodeURIComponent(message));
}

export async function getStoreSettings() {
  await connectToDatabase();

  const settings = await StoreSettings.findOne({ key: "default" }).lean();
  if (!settings) return DEFAULT_STORE_SETTINGS;

  return {
    key: "default" as const,
    delivery: {
      model: "SELF_AND_COURIER" as const,
      selfDelivery: {
        freeAboveOrderValuePaise:
          settings.delivery.selfDelivery.freeAboveOrderValuePaise,
        distanceSlabs: settings.delivery.selfDelivery.distanceSlabs.map((slab) => ({
          fromKm: slab.fromKm,
          toKm: slab.toKm,
          feePaise: slab.feePaise,
        })),
      },
      courier: {
        pricingMode: "MANUAL_CONFIGURATION" as const,
        flatFeePaise: settings.delivery.courier.flatFeePaise,
      },
    },
  };
}

export async function updateStoreDeliverySettingsAction(formData: FormData) {
  await requireAdmin("/admin/settings");

  const parsed = storeDeliverySettingsSchema.safeParse({
    freeAboveOrderValue: value(formData, "freeAboveOrderValue"),
    slab1ToKm: value(formData, "slab1ToKm"),
    slab1Fee: value(formData, "slab1Fee"),
    slab2ToKm: value(formData, "slab2ToKm"),
    slab2Fee: value(formData, "slab2Fee"),
    slab3ToKm: value(formData, "slab3ToKm"),
    slab3Fee: value(formData, "slab3Fee"),
    courierFlatFee: value(formData, "courierFlatFee"),
  });

  if (!parsed.success) {
    errorRedirect(parsed.error.issues[0]?.message || "Invalid delivery settings.");
  }

  const slab1ToKm = Number(parsed.data.slab1ToKm);
  const slab2ToKm = Number(parsed.data.slab2ToKm);
  const slab3ToKm = Number(parsed.data.slab3ToKm);

  if (!(slab1ToKm > 0 && slab2ToKm > slab1ToKm && slab3ToKm > slab2ToKm)) {
    errorRedirect("Distance slabs must increase in order.");
  }

  try {
    await connectToDatabase();

    await StoreSettings.findOneAndUpdate(
      { key: "default" },
      {
        $set: {
          delivery: {
            model: DEFAULT_STORE_SETTINGS.delivery.model,
            selfDelivery: {
              freeAboveOrderValuePaise: parseMoneyToPaise(
                parsed.data.freeAboveOrderValue
              ),
              distanceSlabs: [
                {
                  fromKm: 0,
                  toKm: slab1ToKm,
                  feePaise: parseMoneyToPaise(parsed.data.slab1Fee),
                },
                {
                  fromKm: slab1ToKm,
                  toKm: slab2ToKm,
                  feePaise: parseMoneyToPaise(parsed.data.slab2Fee),
                },
                {
                  fromKm: slab2ToKm,
                  toKm: slab3ToKm,
                  feePaise: parseMoneyToPaise(parsed.data.slab3Fee),
                },
              ],
            },
            courier: {
              pricingMode: DEFAULT_STORE_SETTINGS.delivery.courier.pricingMode,
              flatFeePaise: parseMoneyToPaise(parsed.data.courierFlatFee),
            },
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    revalidatePath("/admin/settings");
    revalidatePath("/checkout");
    revalidatePath("/cart");

    redirect(
      "/admin/settings?success=" +
        encodeURIComponent("Delivery settings saved.")
    );
  } catch (error) {
    errorRedirect(
      error instanceof Error
        ? error.message
        : "Unable to save delivery settings."
    );
  }
}
