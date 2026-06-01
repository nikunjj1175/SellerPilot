import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const REFRESH_COOKIE = "sp_refresh_token";
export const ACCESS_TTL_SEC = 15 * 60;
export const REFRESH_TTL_SEC = 30 * 24 * 60 * 60;

export type RefreshJwtPayload = JWTPayload & {
  sub: string;
  jti: string;
  type: "refresh";
};

export function refreshSecretKey() {
  const secret = process.env.JWT_REFRESH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET or JWT_REFRESH_SECRET is required");
  return new TextEncoder().encode(secret);
}

export async function signRefreshJwt(userId: string, jti: string) {
  return new SignJWT({ type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TTL_SEC}s`)
    .sign(refreshSecretKey());
}

/** Signature + expiry only (safe for Edge middleware). */
export async function verifyRefreshJwt(token: string): Promise<RefreshJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecretKey(), {
      algorithms: ["HS256"],
    });
    if (payload.type !== "refresh" || !payload.sub || !payload.jti) return null;
    return payload as RefreshJwtPayload;
  } catch {
    return null;
  }
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: REFRESH_TTL_SEC,
  };
}
