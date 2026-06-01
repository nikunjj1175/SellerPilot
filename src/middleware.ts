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

/** Old routes → My Reports or related */
const DASHBOARD_REDIRECTS: Record<string, string> = {
  "/dashboard": "/dashboard/reports",
  "/dashboard/agency": "/dashboard/reports",
  "/dashboard/developer": "/dashboard/reports",
  "/dashboard/billing": "/dashboard/credits",
  "/dashboard/integrations": "/dashboard/reports/new",
  "/dashboard/analytics": "/dashboard/reports",
  "/dashboard/states": "/dashboard/reports",
  "/dashboard/sku": "/dashboard/reports",
  "/dashboard/returns": "/dashboard/reports",
  "/dashboard/rto": "/dashboard/reports",
  "/dashboard/insights": "/dashboard/reports",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (pathname.startsWith("/api/cron")) {
    if (!verifyCronAuth(req)) return cronUnauthorizedResponse();
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/jobs")) {
    if (isQStashVerificationRequired() && !process.env.QSTASH_CURRENT_SIGNING_KEY) {
      return NextResponse.json({ error: "Webhook verification required" }, { status: 403 });
    }
    return NextResponse.next();
  }

  const isProtectedApi =
    pathname.startsWith("/api/reports") || pathname.startsWith("/api/payments");

  if (isProtectedApi) {
    if (!isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ip = getClientIp(req);
    const limited = checkRateLimit(`api:${req.auth?.user?.id ?? ip}`, 80, 60_000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);
    return NextResponse.next();
  }

  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");

  if ((isDashboard || isAdmin) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdmin && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/reports", req.url));
  }

  const redirectTo = DASHBOARD_REDIRECTS[pathname];
  if (redirectTo && isLoggedIn) {
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard/reports", req.url));
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
  ],
};
