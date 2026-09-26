"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { Banner } from "@/models/Banner";
import {
  bannerCreateSchema,
  bannerIdSchema,
  bannerUpdateSchema,
} from "@/schemas/banner";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function errorRedirect(message: string): never {
  redirect("/admin/banners?error=" + encodeURIComponent(message));
}

function successRedirect(message: string): never {
  redirect("/admin/banners?success=" + encodeURIComponent(message));
}

function parseDate(value: string, label: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(label + " must be a valid date and time.");
  }
  return date;
}

function parseSortOrder(value: string) {
  const order = Number(value);
  if (!Number.isInteger(order) || order < 0 || order > 10000) {
    throw new Error("Display order must be a whole number from 0 to 10,000.");
  }
  return order;
}

export type PublicBanner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl: string;
};

export async function getActiveBanners(): Promise<PublicBanner[]> {
  await connectToDatabase();

  const now = new Date();
  const banners = await Banner.find({
    isActive: true,
    startsAt: { $lte: now },
    expiresAt: { $gt: now },
  })
    .select("_id title subtitle imageUrl linkUrl")
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(6)
    .lean();

  return banners.map((banner) => ({
    id: String(banner._id),
    title: banner.title,
    subtitle: banner.subtitle || undefined,
    imageUrl: banner.imageUrl,
    linkUrl: banner.linkUrl,
  }));
}

export async function getAdminBanners() {
  await requireAdmin("/admin/banners");
  await connectToDatabase();

  const banners = await Banner.find({})
    .sort({ isActive: -1, sortOrder: 1, expiresAt: 1, createdAt: -1 })
    .lean();

  return {
    banners,
    now: Date.now(),
  };
}

export async function getAdminBanner(bannerId: string) {
  await requireAdmin("/admin/banners");
  const parsed = bannerIdSchema.safeParse({ bannerId });
  if (!parsed.success) return null;

  await connectToDatabase();
  return Banner.findById(parsed.data.bannerId).lean();
}

export async function createBannerAction(formData: FormData) {
  await requireAdmin("/admin/banners");

  const parsed = bannerCreateSchema.safeParse({
    title: value(formData, "title"),
    subtitle: value(formData, "subtitle"),
    imageUrl: value(formData, "imageUrl"),
    linkUrl: value(formData, "linkUrl"),
    startsAt: value(formData, "startsAt"),
    expiresAt: value(formData, "expiresAt"),
    sortOrder: value(formData, "sortOrder") || "0",
    isActive: formData.get("isActive") === "on" ? "on" : "off",
  });

  if (!parsed.success) {
    errorRedirect(parsed.error.issues[0]?.message || "Please check the banner details.");
  }

  const startsAt = parseDate(parsed.data.startsAt, "Start date");
  const expiresAt = parseDate(parsed.data.expiresAt, "Expiry date");
  if (expiresAt <= startsAt) {
    errorRedirect("Expiry date must be later than the start date.");
  }

  let sortOrder: number;
  try {
    sortOrder = parseSortOrder(parsed.data.sortOrder);
  } catch (error) {
    errorRedirect(error instanceof Error ? error.message : "Invalid display order.");
  }

  await connectToDatabase();

  await Banner.create({
    title: parsed.data.title,
    subtitle: parsed.data.subtitle || undefined,
    imageUrl: parsed.data.imageUrl,
    linkUrl: parsed.data.linkUrl,
    startsAt,
    expiresAt,
    sortOrder,
    isActive: parsed.data.isActive === "on",
  });

  revalidatePath("/");
  revalidatePath("/admin/banners");
  successRedirect("Banner created.");
}

export async function updateBannerAction(formData: FormData) {
  await requireAdmin("/admin/banners");

  const parsed = bannerUpdateSchema.safeParse({
    bannerId: value(formData, "bannerId"),
    title: value(formData, "title"),
    subtitle: value(formData, "subtitle"),
    imageUrl: value(formData, "imageUrl"),
    linkUrl: value(formData, "linkUrl"),
    startsAt: value(formData, "startsAt"),
    expiresAt: value(formData, "expiresAt"),
    sortOrder: value(formData, "sortOrder") || "0",
    isActive: formData.get("isActive") === "on" ? "on" : "off",
  });

  if (!parsed.success) {
    redirect(
      "/admin/banners/" +
        encodeURIComponent(value(formData, "bannerId")) +
        "?error=" +
        encodeURIComponent(
          parsed.error.issues[0]?.message || "Please check the banner details."
        )
    );
  }

  const startsAt = parseDate(parsed.data.startsAt, "Start date");
  const expiresAt = parseDate(parsed.data.expiresAt, "Expiry date");
  if (expiresAt <= startsAt) {
    redirect(
      "/admin/banners/" +
        encodeURIComponent(parsed.data.bannerId) +
        "?error=" +
        encodeURIComponent("Expiry date must be later than the start date.")
    );
  }

  let sortOrder: number;
  try {
    sortOrder = parseSortOrder(parsed.data.sortOrder);
  } catch (error) {
    redirect(
      "/admin/banners/" +
        encodeURIComponent(parsed.data.bannerId) +
        "?error=" +
        encodeURIComponent(
          error instanceof Error ? error.message : "Invalid display order."
        )
    );
  }

  await connectToDatabase();

  const banner = await Banner.findById(parsed.data.bannerId);
  if (!banner) {
    errorRedirect("Banner not found.");
  }

  banner!.title = parsed.data.title;
  banner!.subtitle = parsed.data.subtitle || undefined;
  banner!.imageUrl = parsed.data.imageUrl;
  banner!.linkUrl = parsed.data.linkUrl;
  banner!.startsAt = startsAt;
  banner!.expiresAt = expiresAt;
  banner!.sortOrder = sortOrder;
  banner!.isActive = parsed.data.isActive === "on";

  await banner!.save();

  revalidatePath("/");
  revalidatePath("/admin/banners");
  redirect(
    "/admin/banners?success=" + encodeURIComponent("Banner updated.")
  );
}

export async function toggleBannerAction(formData: FormData) {
  await requireAdmin("/admin/banners");

  const parsed = bannerIdSchema.safeParse({
    bannerId: value(formData, "bannerId"),
  });
  if (!parsed.success) {
    errorRedirect("Invalid banner identifier.");
  }

  await connectToDatabase();
  const banner = await Banner.findById(parsed.data.bannerId).select(
    "_id title isActive"
  );
  if (!banner) {
    errorRedirect("Banner not found.");
  }

  banner!.isActive = !banner!.isActive;
  await banner!.save();

  revalidatePath("/");
  revalidatePath("/admin/banners");
  successRedirect(
    "Banner " + (banner!.isActive ? "activated." : "deactivated.")
  );
}

export async function deleteBannerAction(formData: FormData) {
  await requireAdmin("/admin/banners");

  const parsed = bannerIdSchema.safeParse({
    bannerId: value(formData, "bannerId"),
  });
  if (!parsed.success) {
    errorRedirect("Invalid banner identifier.");
  }

  await connectToDatabase();
  const banner = await Banner.findById(parsed.data.bannerId).select(
    "_id title"
  );
  if (!banner) {
    errorRedirect("Banner not found.");
  }

  await Banner.findByIdAndDelete(parsed.data.bannerId);

  revalidatePath("/");
  revalidatePath("/admin/banners");
  successRedirect("Banner deleted.");
}
