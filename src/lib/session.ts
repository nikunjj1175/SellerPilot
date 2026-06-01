import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { validateRefreshCookieForUser } from "@/lib/jwt-refresh";

export async function requireSession() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const refreshOk = await validateRefreshCookieForUser(session.user.id);
  if (!refreshOk) {
    redirect("/login?error=SessionExpired");
  }

  return session;
}

/** For API routes: session + refresh JWT validated in DB. */
export async function requireApiSession() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const refreshOk = await validateRefreshCookieForUser(session.user.id);
  if (!refreshOk) return null;

  return session;
}
