import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

/** Logged-in user from NextAuth JWT (no extra refresh API calls). */
export type AuthUser = {
  id: string;
  role: string;
  credits: number;
  email?: string | null;
  name?: string | null;
};

function userFromToken(token: Record<string, unknown> | null): AuthUser | null {
  const id = (token?.id ?? token?.sub) as string | undefined;
  if (!id) return null;
  return {
    id,
    role: (token?.role as string) ?? "USER",
    credits: (token?.credits as number) ?? 0,
    email: (token?.email as string) ?? null,
    name: (token?.name as string) ?? null,
  };
}

/** Server Components, Server Actions — use `auth()` via this helper. */
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    role: session.user.role ?? "USER",
    credits: session.user.credits ?? 0,
    email: session.user.email,
    name: session.user.name,
  };
}

/** API Route Handlers — pass the incoming `Request`. */
export async function getAuthUserFromRequest(req: Request): Promise<AuthUser | null> {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });
  return userFromToken(token as Record<string, unknown> | null);
}

export function unauthorizedJson(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}
