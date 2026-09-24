import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@/types";

/**
 * Retrieves the current authenticated session on the server.
 */
export async function getServerAuthSession() {
  return await getServerSession(authOptions);
}

/**
 * Retrieves the current authenticated user or null.
 */
export async function getCurrentUser() {
  const session = await getServerAuthSession();
  return session?.user ?? null;
}

/**
 * Guard: Requires the user to be authenticated.
 * If not authenticated, redirects to the login page.
 */
export async function requireAuth(callbackUrl = "/") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return user;
}

/**
 * Guard: Requires the user to have one of the specified roles.
 * If not authenticated, redirects to login.
 * If unauthorized, redirects to the /unauthorized page.
 */
export async function requireRole(allowedRoles: UserRole[], callbackUrl = "/") {
  const user = await requireAuth(callbackUrl);

  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }

  return user;
}

/**
 * Guard: Requires the user to be an ADMIN or SUPER_ADMIN.
 * Used for server-component protection of admin layouts and pages.
 */
export async function requireAdmin(callbackUrl = "/admin") {
  return await requireRole(["ADMIN", "SUPER_ADMIN"], callbackUrl);
}

/**
 * Helper to check if a user has admin privileges.
 */
export function isAdmin(role?: UserRole): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/**
 * Helper to check if a user is a customer.
 */
export function isCustomer(role?: UserRole): boolean {
  return role === "CUSTOMER";
}
