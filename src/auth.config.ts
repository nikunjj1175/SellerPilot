import type { NextAuthConfig } from "next-auth";
import { ACCESS_TTL_SEC } from "@/lib/jwt-refresh-edge";

/** Edge-safe config (no Mongoose) — used by middleware */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: ACCESS_TTL_SEC },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      const now = Math.floor(Date.now() / 1000);
      if (user?.id) {
        token.id = user.id;
        token.accessExp = now + ACCESS_TTL_SEC;
      }
      if (user && "role" in user) token.role = (user as { role?: string }).role;
      if (user && "credits" in user) token.credits = (user as { credits?: number }).credits;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "USER";
        session.user.credits = (token.credits as number) ?? 0;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
