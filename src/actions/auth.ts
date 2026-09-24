"use server";

import { createSafeAction } from "@/lib/safe-action";
import { loginSchema, LoginInput } from "@/schemas/auth";
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
