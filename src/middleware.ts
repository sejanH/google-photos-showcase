import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = req.nextUrl.pathname === "/admin/login";
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const forceReauth = req.nextUrl.searchParams.get("reauth") === "true";

  // Allow auth API routes to pass through
  if (isApiAuthRoute) return NextResponse.next();

  // Admin routes require authentication
  if (isAdminRoute && !isLoginPage) {
    if (!req.auth) {
      const loginUrl = new URL("/admin/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If logged in and on login page, redirect to admin dashboard
  // UNLESS forceReauth is true (user needs to re-authenticate with Google)
  if (isLoginPage && req.auth && !forceReauth) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/auth/:path*"],
};
