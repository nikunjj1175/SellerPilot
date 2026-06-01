import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { RefreshToken, User } from "@/models";
import {
  REFRESH_COOKIE,
  REFRESH_TTL_SEC,
  refreshCookieOptions,
  signRefreshJwt,
  verifyRefreshJwt,
} from "@/lib/jwt-refresh-edge";

export {
  REFRESH_COOKIE,
  ACCESS_TTL_SEC,
  REFRESH_TTL_SEC,
  refreshCookieOptions,
  signRefreshJwt,
  verifyRefreshJwt,
  type RefreshJwtPayload,
} from "@/lib/jwt-refresh-edge";

async function persistRefreshToken(userId: string, jti: string) {
  await connectDB();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000);
  await RefreshToken.create({
    userId: new mongoose.Types.ObjectId(userId),
    jti,
    expiresAt,
  });
  return expiresAt;
}

export async function isRefreshTokenActive(jti: string, userId: string) {
  await connectDB();
  const row = await RefreshToken.findOne({
    jti,
    userId: new mongoose.Types.ObjectId(userId),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).lean();
  return !!row;
}

export async function revokeRefreshToken(jti: string) {
  await connectDB();
  await RefreshToken.updateOne({ jti }, { $set: { revokedAt: new Date() } });
}

export async function revokeAllUserRefreshTokens(userId: string) {
  await connectDB();
  await RefreshToken.updateMany(
    { userId: new mongoose.Types.ObjectId(userId), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

export async function issueRefreshToken(userId: string) {
  const jti = randomBytes(16).toString("hex");
  const token = await signRefreshJwt(userId, jti);
  await persistRefreshToken(userId, jti);
  return { token, jti };
}

export async function rotateRefreshToken(oldJti: string, userId: string) {
  await revokeRefreshToken(oldJti);
  return issueRefreshToken(userId);
}

export async function setRefreshCookie(token: string) {
  const store = await cookies();
  store.set(REFRESH_COOKIE, token, refreshCookieOptions());
}

export async function clearRefreshCookie() {
  const store = await cookies();
  store.delete(REFRESH_COOKIE);
}

export async function readRefreshCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}

export async function validateRefreshCookieForUser(userId: string): Promise<boolean> {
  const raw = await readRefreshCookie();
  if (!raw) return false;

  const payload = await verifyRefreshJwt(raw);
  if (!payload?.sub || !payload.jti) return false;
  if (payload.sub !== userId) return false;

  return isRefreshTokenActive(payload.jti, userId);
}

export async function validateRefreshFromRequest(
  refreshRaw: string | undefined
): Promise<{ userId: string; jti: string } | null> {
  if (!refreshRaw) return null;

  const payload = await verifyRefreshJwt(refreshRaw);
  if (!payload?.sub || !payload.jti) return null;

  const active = await isRefreshTokenActive(payload.jti, payload.sub);
  if (!active) return null;

  await connectDB();
  const user = await User.findById(payload.sub)
    .select("suspended")
    .lean<{ suspended: boolean } | null>();
  if (!user || user.suspended) return null;

  return { userId: payload.sub, jti: payload.jti };
}
