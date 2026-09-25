"use server";

import mongoose from "mongoose";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { connectToDatabase } from "@/lib/db";
import { Address } from "@/models/Address";
import {
  deleteSavedAddressSchema,
  savedAddressSchema,
  updateSavedAddressSchema,
} from "@/schemas/address";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseAddressForm(formData: FormData) {
  return savedAddressSchema.safeParse({
    label: formValue(formData, "label"),
    fullName: formValue(formData, "fullName"),
    phone: formValue(formData, "phone"),
    pincode: formValue(formData, "pincode"),
    house: formValue(formData, "house"),
    street: formValue(formData, "street"),
    landmark: formValue(formData, "landmark"),
    city: formValue(formData, "city"),
    state: formValue(formData, "state"),
    isDefault: formData.get("isDefault") === "on",
  });
}

async function makeDefault(userId: string, addressId: mongoose.Types.ObjectId) {
  await Address.updateMany(
    { user: userId, _id: { $ne: addressId }, isDefault: true },
    { $set: { isDefault: false } }
  );
}

export async function createSavedAddressAction(formData: FormData) {
  const parsed = parseAddressForm(formData);
  if (!parsed.success) {
    redirect("/account/addresses?error=" + encodeURIComponent(parsed.error.issues[0]?.message || "Invalid address."));
  }

  const user = await requireAuth("/account/addresses");
  await connectToDatabase();

  const existingCount = await Address.countDocuments({ user: user.id });
  const shouldDefault = parsed.data.isDefault || existingCount === 0;

  const address = await Address.create({
    user: new mongoose.Types.ObjectId(user.id),
    ...parsed.data,
    isDefault: shouldDefault,
  });

  if (shouldDefault) {
    await makeDefault(user.id, address._id);
    await Address.updateOne(
      { _id: address._id, user: user.id },
      { $set: { isDefault: true } }
    );
  }

  redirect("/account/addresses?success=Address%20saved.");
}

export async function updateSavedAddressAction(formData: FormData) {
  const parsed = updateSavedAddressSchema.safeParse({
    id: formValue(formData, "id"),
    label: formValue(formData, "label"),
    fullName: formValue(formData, "fullName"),
    phone: formValue(formData, "phone"),
    pincode: formValue(formData, "pincode"),
    house: formValue(formData, "house"),
    street: formValue(formData, "street"),
    landmark: formValue(formData, "landmark"),
    city: formValue(formData, "city"),
    state: formValue(formData, "state"),
    isDefault: formData.get("isDefault") === "on",
  });

  if (!parsed.success) {
    redirect("/account/addresses?error=" + encodeURIComponent(parsed.error.issues[0]?.message || "Invalid address."));
  }

  const user = await requireAuth("/account/addresses");
  await connectToDatabase();

  const address = await Address.findOne({
    _id: parsed.data.id,
    user: user.id,
  });

  if (!address) {
    redirect("/account/addresses?error=Address%20not%20found.");
  }

  address.label = parsed.data.label;
  address.fullName = parsed.data.fullName;
  address.phone = parsed.data.phone;
  address.pincode = parsed.data.pincode;
  address.house = parsed.data.house;
  address.street = parsed.data.street;
  address.landmark = parsed.data.landmark || undefined;
  address.city = parsed.data.city;
  address.state = parsed.data.state;

  if (parsed.data.isDefault) {
    await makeDefault(user.id, address._id);
    address.isDefault = true;
  }

  await address.save();
  redirect("/account/addresses?success=Address%20updated.");
}

export async function deleteSavedAddressAction(formData: FormData) {
  const parsed = deleteSavedAddressSchema.safeParse({
    id: formValue(formData, "id"),
  });

  if (!parsed.success) {
    redirect("/account/addresses?error=Invalid%20address.");
  }

  const user = await requireAuth("/account/addresses");
  await connectToDatabase();

  const address = await Address.findOneAndDelete({
    _id: parsed.data.id,
    user: user.id,
  });

  if (!address) {
    redirect("/account/addresses?error=Address%20not%20found.");
  }

  if (address.isDefault) {
    const replacement = await Address.findOne({ user: user.id })
      .sort({ createdAt: -1 })
      .select("_id");

    if (replacement) {
      await Address.updateOne(
        { _id: replacement._id, user: user.id },
        { $set: { isDefault: true } }
      );
    }
  }

  redirect("/account/addresses?success=Address%20deleted.");
}

export async function getSavedAddresses(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return [];

  await connectToDatabase();

  return Address.find({ user: userId })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();
}
