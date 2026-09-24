import { z } from "zod";

/**
 * Server-side Environment Variables Schema
 * Validates critical infrastructure configuration at application bootstrap.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().optional().default("3000"),

  // Database
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required to establish database connection"),

  // Authentication (NextAuth v4)
  NEXTAUTH_SECRET: z
    .string()
    .min(16, "NEXTAUTH_SECRET must be at least 16 characters for security"),
  NEXTAUTH_URL: z
    .string()
    .url("NEXTAUTH_URL must be a valid URL")
    .optional()
    .or(z.literal("")),

  // Cloudinary Architecture Placeholders (Optional in Phase 1)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Razorpay Architecture Placeholders (Optional in Phase 1)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables safely.
 * Throws a descriptive error in non-production or build if misconfigured.
 */
export function getEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => ` - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    
    // In build or test time, we want to notify without crashing static analysis
    if (process.env.NODE_ENV === "production") {
      throw new Error(`[CRITICAL] Invalid environment variables:\n${errorDetails}`);
    } else {
      console.warn(`[WARN] Environment variable validation issues:\n${errorDetails}`);
    }
    
    // Return partial fallback in dev to prevent toolchain failures during builds
    return process.env as unknown as Env;
  }

  return result.data;
}

export const env = getEnv();
