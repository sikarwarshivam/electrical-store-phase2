"use server";

import { createSafeAction } from "@/lib/safe-action";
import { loginSchema, LoginInput, registerSchema, RegisterInput } from "@/schemas/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";
export const validateCredentialsAction = createSafeAction<
  LoginInput,
  { valid: boolean; email: string; role?: string }
>(loginSchema, async (data) => {
  logger.info(`Validating login credentials server-side for: ${data.email}`);

  try {
    await connectToDatabase();
    const user = await User.findOne({ email: data.email });

    if (!user || !user.isActive) {
      return { valid: false, email: data.email };
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);

    return {
      valid,
      email: user.email,
      role: valid ? user.role : undefined,
    };
  } catch (error) {
    logger.error("Credential validation failed because the database was unavailable.", error);
    throw new Error("Authentication service is temporarily unavailable.");
  }
});


export const registerCustomerAction = createSafeAction<
  RegisterInput,
  { userId: string; email: string }
>(registerSchema, async (data) => {
  await connectToDatabase();

  const existingUser = await User.findOne({ email: data.email })
    .select("_id")
    .lean();

  if (existingUser) {
    return Promise.reject(new Error("An account with this email already exists. Please sign in."));
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  try {
    const user = await User.create({
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      passwordHash,
      role: "CUSTOMER",
      isActive: true,
    });

    logger.info("Customer account registered", { userId: user._id.toString() });

    return {
      userId: user._id.toString(),
      email: user.email,
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new Error("An account with this email already exists. Please sign in.");
    }
    throw error;
  }
});
