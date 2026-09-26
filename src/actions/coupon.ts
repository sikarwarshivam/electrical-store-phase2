"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { connectToDatabase } from "@/lib/db";
import { parseMoneyToPaise } from "@/lib/money";
import { Coupon } from "@/models/Coupon";
import {
  couponCreateSchema,
  couponIdSchema,
  couponUpdateSchema,
} from "@/schemas/coupon";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function errorRedirect(message: string): never {
  redirect("/admin/coupons?error=" + encodeURIComponent(message));
}

function successRedirect(message: string): never {
  redirect("/admin/coupons?success=" + encodeURIComponent(message));
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

function parseDate(value: string, label: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(label + " must be a valid date and time.");
  }
  return date;
}

export async function getAdminCoupons() {
  await requireAdmin("/admin/coupons");
  await connectToDatabase();

  const coupons = await Coupon.find({})
    .sort({ isActive: -1, expiresAt: 1, createdAt: -1 })
    .lean();

  return {
    coupons,
    now: Date.now(),
  };
}

export type PublicCouponOffer = {
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minOrderValuePaise: number;
  expiresAt: string;
};

export async function getAvailableCoupons(): Promise<PublicCouponOffer[]> {
  await connectToDatabase();

  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    startsAt: { $lte: now },
    expiresAt: { $gt: now },
    $expr: {
      $or: [
        { $eq: ["$usageLimit", 0] },
        {
          $lt: [
            { $add: ["$usedCount", { $ifNull: ["$reservedCount", 0] }] },
            "$usageLimit",
          ],
        },
      ],
    },
  })
    .select("code discountType discountValue minOrderValuePaise expiresAt")
    .sort({ discountType: 1, discountValue: -1, minOrderValuePaise: 1, expiresAt: 1 })
    .limit(6)
    .lean();

  return coupons.map((coupon) => ({
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minOrderValuePaise: coupon.minOrderValuePaise,
    expiresAt: coupon.expiresAt.toISOString(),
  }));
}

export async function updateCouponAction(formData: FormData) {
  await requireAdmin("/admin/coupons");

  const parsed = couponUpdateSchema.safeParse({
    couponId: value(formData, "couponId"),
    code: value(formData, "code"),
    discountType: value(formData, "discountType") || "PERCENTAGE",
    discountValue: value(formData, "discountValue"),
    minOrderValue: value(formData, "minOrderValue"),
    startsAt: value(formData, "startsAt"),
    expiresAt: value(formData, "expiresAt"),
    usageLimit: value(formData, "usageLimit"),
    isActive: formData.get("isActive") === "on" ? "on" : "off",
  });

  if (!parsed.success) {
    errorRedirect(parsed.error.issues[0]?.message || "Please check the coupon details.");
  }

  const discountValue = Number(parsed.data.discountValue);
  const usageLimit = Number(parsed.data.usageLimit);
  const minOrderValuePaise = parseMoneyToPaise(parsed.data.minOrderValue);
  const startsAt = parseDate(parsed.data.startsAt, "Start date");
  const expiresAt = parseDate(parsed.data.expiresAt, "Expiry date");

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    errorRedirect("Discount value must be greater than zero.");
  }
  if (parsed.data.discountType === "PERCENTAGE" && discountValue > 100) {
    errorRedirect("Percentage discount cannot be greater than 100%.");
  }
  if (parsed.data.discountType === "FLAT" && parseMoneyToPaise(parsed.data.discountValue) <= 0) {
    errorRedirect("Flat discount must be greater than zero.");
  }
  if (!Number.isInteger(usageLimit) || usageLimit < 0 || usageLimit > 1_000_000) {
    errorRedirect("Usage limit must be a whole number from 0 to 1,000,000.");
  }
  if (expiresAt <= startsAt) {
    errorRedirect("Expiry date must be later than the start date.");
  }

  await connectToDatabase();
  const coupon = await Coupon.findById(parsed.data.couponId);
  if (!coupon) errorRedirect("Coupon not found.");

  const usedCount = coupon.usedCount ?? 0;
  const reservedCount = coupon.reservedCount ?? 0;
  if (usageLimit > 0 && usageLimit < usedCount + reservedCount) {
    errorRedirect("Usage limit cannot be lower than usage already used or reserved.");
  }
  if (coupon.code !== parsed.data.code && usedCount > 0) {
    errorRedirect("A used coupon cannot have its code changed.");
  }

  coupon.code = parsed.data.code;
  coupon.discountType = parsed.data.discountType;
  coupon.discountValue =
    parsed.data.discountType === "FLAT"
      ? parseMoneyToPaise(parsed.data.discountValue)
      : discountValue;
  coupon.minOrderValuePaise = minOrderValuePaise;
  coupon.startsAt = startsAt;
  coupon.expiresAt = expiresAt;
  coupon.usageLimit = usageLimit;
  coupon.isActive = parsed.data.isActive === "on";
  await coupon.save();

  revalidatePath("/admin/coupons");
  revalidatePath("/");
  successRedirect("Coupon updated.");
}

export async function createCouponAction(formData: FormData)
  await requireAdmin("/admin/coupons");

  const parsed = couponCreateSchema.safeParse({
    code: value(formData, "code"),
    discountType: value(formData, "discountType") || "PERCENTAGE",
    discountValue: value(formData, "discountValue"),
    minOrderValue: value(formData, "minOrderValue"),
    startsAt: value(formData, "startsAt"),
    expiresAt: value(formData, "expiresAt"),
    usageLimit: value(formData, "usageLimit"),
    isActive: formData.get("isActive") === "on" ? "on" : "off",
  });

  if (!parsed.success) {
    errorRedirect(
      parsed.error.issues[0]?.message || "Please check the coupon details."
    );
  }

  const discountValue = Number(parsed.data.discountValue);
  const usageLimit = Number(parsed.data.usageLimit);
  const minOrderValuePaise = parseMoneyToPaise(parsed.data.minOrderValue);
  const startsAt = parseDate(parsed.data.startsAt, "Start date");
  const expiresAt = parseDate(parsed.data.expiresAt, "Expiry date");

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    errorRedirect("Discount value must be greater than zero.");
  }

  if (parsed.data.discountType === "PERCENTAGE" && discountValue > 100) {
    errorRedirect("Percentage discount cannot be greater than 100%.");
  }

  if (parsed.data.discountType === "FLAT") {
    const flatDiscountPaise = parseMoneyToPaise(parsed.data.discountValue);
    if (flatDiscountPaise <= 0) {
      errorRedirect("Flat discount must be greater than zero.");
    }
  }

  if (!Number.isInteger(usageLimit) || usageLimit < 0 || usageLimit > 1_000_000) {
    errorRedirect("Usage limit must be a whole number from 0 to 1,000,000.");
  }

  if (expiresAt <= startsAt) {
    errorRedirect("Expiry date must be later than the start date.");
  }

  await connectToDatabase();

  try {
    await Coupon.create({
      code: parsed.data.code,
      discountType: parsed.data.discountType,
      discountValue:
        parsed.data.discountType === "FLAT"
          ? parseMoneyToPaise(parsed.data.discountValue)
          : discountValue,
      minOrderValuePaise,
      startsAt,
      expiresAt,
      usageLimit,
      usedCount: 0,
      isActive: parsed.data.isActive === "on",
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      errorRedirect("A coupon with this code already exists.");
    }
    errorRedirect(
      error instanceof Error ? error.message : "Unable to create coupon."
    );
  }

  revalidatePath("/admin/coupons");
  successRedirect("Coupon created.");
}

export async function toggleCouponAction(formData: FormData) {
  await requireAdmin("/admin/coupons");

  const parsed = couponIdSchema.safeParse({
    couponId: value(formData, "couponId"),
  });
  if (!parsed.success) {
    errorRedirect("Invalid coupon identifier.");
  }

  await connectToDatabase();

  const coupon = await Coupon.findById(parsed.data.couponId).select(
    "_id code isActive"
  );
  if (!coupon) {
    errorRedirect("Coupon not found.");
  }

  coupon!.isActive = !coupon!.isActive;
  await coupon!.save();

  revalidatePath("/admin/coupons");
  successRedirect(
    `Coupon ${coupon!.code} ${coupon!.isActive ? "activated" : "deactivated"}.`
  );
}

export async function deleteCouponAction(formData: FormData) {
  await requireAdmin("/admin/coupons");

  const parsed = couponIdSchema.safeParse({
    couponId: value(formData, "couponId"),
  });
  if (!parsed.success) {
    errorRedirect("Invalid coupon identifier.");
  }

  await connectToDatabase();

  const coupon = await Coupon.findById(parsed.data.couponId).select(
    "_id code usedCount"
  );
  if (!coupon) {
    errorRedirect("Coupon not found.");
  }

  if ((coupon!.usedCount ?? 0) > 0) {
    errorRedirect("Used coupons are retained for order-audit history and cannot be deleted.");
  }

  await Coupon.findByIdAndDelete(parsed.data.couponId);

  revalidatePath("/admin/coupons");
  successRedirect(`Coupon ${coupon!.code} deleted.`);
}
