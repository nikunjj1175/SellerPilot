import type { NextAuthConfig } from "next-auth";

/** Edge-safe config (no Mongoose) — used by middleware */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
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
