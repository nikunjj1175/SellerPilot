import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import {
  ACCESS_TTL_SEC,
  clearRefreshCookie,
  issueRefreshToken,
  isRefreshTokenActive,
  readRefreshCookie,
  revokeAllUserRefreshTokens,
  setRefreshCookie,
  verifyRefreshJwt,
} from "@/lib/jwt-refresh";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({
          email: String(credentials.email).toLowerCase(),
        });
        if (!user?.passwordHash || user.suspended) return null;

        const valid = await bcrypt.compare(String(credentials.password), user.passwordHash);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          credits: user.credits,
        };
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      if (!user?.id) return;
      const { token } = await issueRefreshToken(user.id);
      await setRefreshCookie(token);
    },
    async signOut(message) {
      const userId =
        "token" in message && message.token?.id
          ? (message.token.id as string)
          : undefined;
      if (userId) await revokeAllUserRefreshTokens(userId);
      await clearRefreshCookie();
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await connectDB();
        const email = user.email.toLowerCase();
        let dbUser = await User.findOne({ email });
        if (!dbUser) {
          dbUser = await User.create({
            email,
            name: user.name,
            image: user.image,
            emailVerified: new Date(),
            credits: 10,
          });
        }
        user.id = dbUser._id.toString();
        (user as { role?: string }).role = dbUser.role;
        (user as { credits?: number }).credits = dbUser.credits;
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      const now = Math.floor(Date.now() / 1000);

      if (user?.id) {
        token.id = user.id;
        if ("role" in user) token.role = (user as { role?: string }).role;
        if ("credits" in user) token.credits = (user as { credits?: number }).credits;
        token.accessExp = now + ACCESS_TTL_SEC;
      } else if (!token.id && token.sub) {
        token.id = token.sub;
      }

      if (token.id && (user || trigger === "update")) {
        await connectDB();
        const dbUser = await User.findById(token.id as string).select("role credits suspended");
        if (dbUser?.suspended) return null;
        if (dbUser) {
          token.role = dbUser.role;
          token.credits = dbUser.credits;
        }
        token.accessExp = now + ACCESS_TTL_SEC;
        return token;
      }

      const accessExp = typeof token.accessExp === "number" ? token.accessExp : 0;
      if (now < accessExp) return token;

      const refreshRaw = await readRefreshCookie();
      const payload = refreshRaw ? await verifyRefreshJwt(refreshRaw) : null;
      if (!payload?.sub || !payload.jti) return null;
      if (token.id && payload.sub !== token.id) return null;

      const active = await isRefreshTokenActive(payload.jti, payload.sub);
      if (!active) return null;

      await connectDB();
      const dbUser = await User.findById(payload.sub).select("role credits suspended");
      if (!dbUser || dbUser.suspended) return null;

      token.id = payload.sub;
      token.role = dbUser.role;
      token.credits = dbUser.credits;
      token.accessExp = now + ACCESS_TTL_SEC;
      return token;
    },
    async session({ session, token }) {
      const userId = (token.id ?? token.sub) as string | undefined;
      if (session.user && userId) {
        await connectDB();
        const dbUser = await User.findById(userId).select("role credits");
        session.user.id = userId;
        session.user.role = dbUser?.role ?? (token.role as string) ?? "USER";
        session.user.credits = dbUser?.credits ?? (token.credits as number) ?? 0;
      }
      return session;
    },
  },
});
