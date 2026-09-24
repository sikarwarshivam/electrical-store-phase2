import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { loginSchema } from "@/schemas/auth";
import { logger } from "@/lib/logger";
import { UserRole } from "@/types";

/**
 * Development-only test credentials handler.
 * Strictly environment-gated and completely disabled in production.
 */
function handleDevFallback(email: string, password: string) {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  // Pre-configured test users for offline local UI verification
  if (email === "admin@dev.local" && password === "DevAdmin@123") {
    logger.info("[DEV ONLY] Authenticated development ADMIN test user");
    return {
      id: "dev-admin-id",
      name: "Development Admin",
      email: "admin@dev.local",
      phone: "9876543210",
      role: "ADMIN" as UserRole,
    };
  }

  if (email === "customer@dev.local" && password === "DevCustomer@123") {
    logger.info("[DEV ONLY] Authenticated development CUSTOMER test user");
    return {
      id: "dev-customer-id",
      name: "Development Customer",
      email: "customer@dev.local",
      phone: "9876543211",
      role: "CUSTOMER" as UserRole,
    };
  }

  return null;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          logger.warn("Credentials authorization failed: Invalid input payload");
          return null;
        }

        const { email, password } = parsed.data;

        try {
          await connectToDatabase();

          const user = await User.findOne({ email });
          if (!user) {
            // Environment-gated fallback for local development testing
            if (process.env.NODE_ENV === "development") {
              return handleDevFallback(email, password);
            }
            logger.warn(`Authorization failed: User not found for email ${email}`);
            return null;
          }

          if (!user.isActive) {
            logger.warn(`Authorization failed: User account is inactive for ${email}`);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
          if (!isPasswordValid) {
            logger.warn(`Authorization failed: Invalid password for ${email}`);
            return null;
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          };
        } catch (dbError) {
          logger.error("Database connection/query error during authorization", dbError);

          // Strictly development-only fallback when local database instance is offline
          if (process.env.NODE_ENV === "development") {
            return handleDevFallback(email, password);
          }

          // Production must never bypass the database
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.phone = token.phone as string | undefined;
      }
      return session;
    },
  },
};
