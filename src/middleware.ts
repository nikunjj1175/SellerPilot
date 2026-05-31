import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import {
  verifyCronAuth,
  cronUnauthorizedResponse,
  checkRateLimit,
  rateLimitResponse,
  getClientIp,
  isQStashVerificationRequired,
} from "@/lib/security";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // --- Cron routes: require CRON_SECRET in production ---
  if (pathname.startsWith("/api/cron")) {
    if (!verifyCronAuth(req)) {
      return cronUnauthorizedResponse();
    }
    return NextResponse.next();
  }

  // --- QStash job webhook: block in production if signing not configured ---
  if (pathname.startsWith("/api/jobs")) {
    if (isQStashVerificationRequired() && !process.env.QSTASH_CURRENT_SIGNING_KEY) {
      return NextResponse.json({ error: "Webhook verification required" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // --- Public API v1: rate limit by IP ---
  if (pathname.startsWith("/api/v1")) {
    const ip = getClientIp(req);
    const limited = checkRateLimit(`api-v1:${ip}`, 120, 60_000);
    if (!limited.ok) {
      return rateLimitResponse(limited.retryAfterSec);
    }
    return NextResponse.next();
  }

  // --- Session-protected API routes ---
  const isProtectedApi =
    pathname.startsWith("/api/reports") || pathname.startsWith("/api/payments");

  if (isProtectedApi) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const ip = getClientIp(req);
    const limited = checkRateLimit(`api:${req.auth?.user?.id ?? ip}`, 80, 60_000);
    if (!limited.ok) {
      return rateLimitResponse(limited.retryAfterSec);
    }
    return NextResponse.next();
  }

  // --- Dashboard & admin pages ---
  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");

  if ((isDashboard || isAdmin) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdmin && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/api/reports/:path*",
    "/api/payments/:path*",
    "/api/cron/:path*",
    "/api/jobs/:path*",
    "/api/v1/:path*",
  ],
};
