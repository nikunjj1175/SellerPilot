import { NextResponse } from "next/server";
import {
  readRefreshCookie,
  refreshCookieOptions,
  REFRESH_COOKIE,
  rotateRefreshToken,
  validateRefreshFromRequest,
} from "@/lib/jwt-refresh";
import { createSessionTokenForUser, applySessionCookie } from "@/lib/auth-session-cookie";

/** Validate refresh JWT + DB, rotate refresh token, renew session cookie. */
export async function POST() {
  const refreshRaw = await readRefreshCookie();
  const validated = await validateRefreshFromRequest(refreshRaw);
  if (!validated) {
    const res = NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    res.cookies.delete(REFRESH_COOKIE);
    return res;
  }

  const { token: newRefresh } = await rotateRefreshToken(validated.jti, validated.userId);
  const sessionToken = await createSessionTokenForUser(validated.userId);
  if (!sessionToken) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(REFRESH_COOKIE, newRefresh, refreshCookieOptions());
  applySessionCookie(res, sessionToken);
  return res;
}
