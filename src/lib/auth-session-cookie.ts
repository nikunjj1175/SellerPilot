import { encode } from "@auth/core/jwt";
import type { NextResponse } from "next/server";
import { ACCESS_TTL_SEC } from "@/lib/jwt-refresh-edge";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";

export function getSessionCookieName() {
  const url = process.env.AUTH_URL ?? process.env.APP_URL ?? "";
  const useSecure =
    process.env.NODE_ENV === "production" || url.startsWith("https://");
  return `${useSecure ? "__Secure-" : ""}authjs.session-token`;
}

export async function createSessionTokenForUser(userId: string) {
  await connectDB();
  const user = await User.findById(userId)
    .select("role credits name email image suspended")
    .lean<{
      role: string;
      credits: number;
      name?: string;
      email: string;
      image?: string;
      suspended: boolean;
    } | null>();
  if (!user || user.suspended) return null;

  const now = Math.floor(Date.now() / 1000);
  const salt = getSessionCookieName();

  return encode({
    token: {
      sub: userId,
      id: userId,
      role: user.role,
      credits: user.credits,
      name: user.name ?? undefined,
      email: user.email,
      picture: user.image ?? undefined,
      accessExp: now + ACCESS_TTL_SEC,
    },
    secret: process.env.AUTH_SECRET!,
    salt,
    maxAge: ACCESS_TTL_SEC,
  });
}

export function applySessionCookie(res: NextResponse, sessionToken: string) {
  const name = getSessionCookieName();
  res.cookies.set(name, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: name.startsWith("__Secure-"),
    maxAge: ACCESS_TTL_SEC,
  });
}
