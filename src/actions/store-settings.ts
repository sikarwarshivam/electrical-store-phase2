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

function parsePincodeList(raw: string): string[] {
  const values = raw
    .split(/[\s,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  const unique = [...new Set(values)];
  if (unique.length > 1000) {
    throw new Error("A serviceable pincode list cannot contain more than 1000 entries.");
  }

  const invalid = unique.find((pincode) => !/^\d{6}$/.test(pincode));
  if (invalid) {
    throw new Error(`Invalid pincode "${invalid}". Enter Indian 6-digit pincodes only.`);
  }

  return unique;
}

export async function getStoreSettings() {
  await connectToDatabase();

  const settings = await StoreSettings.findOne({ key: "default" }).lean();
  if (!settings) return DEFAULT_STORE_SETTINGS;

  const codSettings = settings.delivery.cod ?? DEFAULT_STORE_SETTINGS.delivery.cod;
  const serviceability =
    settings.delivery.serviceability ??
    DEFAULT_STORE_SETTINGS.delivery.serviceability;
  const cancellation = settings.delivery.cancellation
    ? {
        enabled: settings.delivery.cancellation.enabled,
        freeCancellationThroughStatus:
          settings.delivery.cancellation.freeCancellationThroughStatus ??
          DEFAULT_STORE_SETTINGS.delivery.cancellation.freeCancellationThroughStatus,
      }
    : DEFAULT_STORE_SETTINGS.delivery.cancellation;

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
      cod: {
        enabled: codSettings.enabled,
        minOrderValuePaise: codSettings.minOrderValuePaise,
        maxOrderValuePaise: codSettings.maxOrderValuePaise,
        convenienceFeePaise: codSettings.convenienceFeePaise,
      },
      serviceability: {
        selfDeliveryPincodes: serviceability.selfDeliveryPincodes,
        courierPincodes: serviceability.courierPincodes,
      },
      cancellation: {
        enabled: cancellation.enabled,
        freeCancellationThroughStatus:
          cancellation.freeCancellationThroughStatus,
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
    codEnabled: formData.get("codEnabled") === "on" ? "on" : "off",
    codMinOrderValue: value(formData, "codMinOrderValue"),
    codMaxOrderValue: value(formData, "codMaxOrderValue"),
    codConvenienceFee: value(formData, "codConvenienceFee"),
    selfDeliveryPincodes: value(formData, "selfDeliveryPincodes"),
    courierPincodes: value(formData, "courierPincodes"),
    cancellationEnabled:
      formData.get("cancellationEnabled") === "off" ? "off" : "on",
    freeCancellationThroughStatus:
      value(formData, "freeCancellationThroughStatus") || "PACKED",
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

  const codMinOrderValuePaise = parseMoneyToPaise(parsed.data.codMinOrderValue);
  const codMaxOrderValuePaise = parseMoneyToPaise(parsed.data.codMaxOrderValue);
  if (parsed.data.codEnabled === "on") {
    if (codMaxOrderValuePaise <= 0 || codMaxOrderValuePaise < codMinOrderValuePaise) {
      errorRedirect("When COD is enabled, the maximum order value must be greater than or equal to the minimum.");
    }
  }

  let selfDeliveryPincodes: string[];
  let courierPincodes: string[];
  try {
    selfDeliveryPincodes = parsePincodeList(parsed.data.selfDeliveryPincodes);
    courierPincodes = parsePincodeList(parsed.data.courierPincodes);
  } catch (error) {
    errorRedirect(
      error instanceof Error ? error.message : "Invalid serviceable pincodes."
    );
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
            cod: {
              enabled: parsed.data.codEnabled === "on",
              minOrderValuePaise: codMinOrderValuePaise,
              maxOrderValuePaise: codMaxOrderValuePaise,
              convenienceFeePaise: parseMoneyToPaise(parsed.data.codConvenienceFee),
            },
            serviceability: {
              selfDeliveryPincodes,
              courierPincodes,
            },
            cancellation: {
              enabled: parsed.data.cancellationEnabled === "on",
              freeCancellationThroughStatus:
                parsed.data.freeCancellationThroughStatus,
            },
          },
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
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
