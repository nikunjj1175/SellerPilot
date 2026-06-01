"use client";

import { useSession } from "next-auth/react";
import { Menu, Coins } from "lucide-react";
import { useMobileNav } from "@/components/dashboard/dashboard-shell";

export function DashboardHeader() {
  const { data: session } = useSession();
  const { setOpen } = useMobileNav();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Seller";

  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between border-b border-border bg-card/95 backdrop-blur px-4 md:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="md:hidden rounded-lg p-2 hover:bg-muted shrink-0"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground truncate">
            Welcome back, <span className="font-semibold text-foreground">{firstName}</span>{" "}
            <span aria-hidden>👋</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm shrink-0">
        <Coins className="h-4 w-4 text-amber-600" />
        <span className="font-medium text-amber-900">
          Credits: <span className="font-bold">{session?.user?.credits ?? 0}</span>
        </span>
      </div>
    </header>
  );
}
