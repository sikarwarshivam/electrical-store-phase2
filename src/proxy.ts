import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Next.js Proxy for Route Protection
 * 
 * Intercepts requests to /admin routes.
 * 1. Unauthenticated users are redirected to /login?callbackUrl=...
 * 2. Authenticated non-admin users (CUSTOMER) are redirected to /unauthorized (403).
 * 3. Authorized admins (ADMIN / SUPER_ADMIN) are allowed through.
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const role = token?.role;

    if (pathname.startsWith("/admin")) {
      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Require valid token to proceed
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
