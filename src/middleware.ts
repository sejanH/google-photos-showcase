import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = req.nextUrl.pathname === "/admin/login";
  const forceReauth = req.nextUrl.searchParams.get("reauth") === "true";
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);

  const nextResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

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

  return nextResponse;
});

export const config = {
  matcher: ["/admin/:path*"],
};
