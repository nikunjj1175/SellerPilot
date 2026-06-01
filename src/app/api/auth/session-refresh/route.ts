import { NextRequest, NextResponse } from "next/server";
import {
  REFRESH_COOKIE,
  refreshCookieOptions,
  rotateRefreshToken,
  validateRefreshFromRequest,
} from "@/lib/jwt-refresh";
import { applySessionCookie, createSessionTokenForUser } from "@/lib/auth-session-cookie";

/** Browser redirect target when session expired but refresh cookie is still valid. */
export async function GET(req: NextRequest) {
  const redirectTo = req.nextUrl.searchParams.get("redirect") || "/dashboard/reports";
  const safeRedirect =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/dashboard/reports";

  const refreshRaw = req.cookies.get(REFRESH_COOKIE)?.value;
  const validated = await validateRefreshFromRequest(refreshRaw);
  if (!validated) {
    const login = new URL("/login", req.url);
    login.searchParams.set("error", "SessionExpired");
    const res = NextResponse.redirect(login);
    res.cookies.delete(REFRESH_COOKIE);
    return res;
  }

  const { token: newRefresh } = await rotateRefreshToken(validated.jti, validated.userId);
  const sessionToken = await createSessionTokenForUser(validated.userId);
  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const res = NextResponse.redirect(new URL(safeRedirect, req.url));
  res.cookies.set(REFRESH_COOKIE, newRefresh, refreshCookieOptions());
  applySessionCookie(res, sessionToken);
  return res;
}
