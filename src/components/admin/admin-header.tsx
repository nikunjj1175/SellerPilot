"use client";

import { useSession } from "next-auth/react";
import { Menu, Shield } from "lucide-react";
import { useAdminMobileNav } from "@/components/admin/admin-shell";

export function AdminHeader() {
  const { data: session } = useSession();
  const { setOpen } = useAdminMobileNav();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Admin";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 backdrop-blur px-4 md:px-6">
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
            Welcome, <span className="font-medium text-foreground">{firstName}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm shrink-0">
        <Shield className="h-4 w-4 text-primary" aria-hidden />
        <span className="text-foreground font-medium">Administrator</span>
      </div>
    </header>
  );
}
