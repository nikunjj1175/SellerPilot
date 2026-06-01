"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/** Keeps session alive while refresh JWT + DB record remain valid. */
export function SessionRefresh() {
  const { status, update } = useSession();
  const busy = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    const tick = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) await update();
        else if (res.status === 401) {
          window.location.href = "/login?error=SessionExpired";
        }
      } finally {
        busy.current = false;
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [status, update]);

  return null;
}
