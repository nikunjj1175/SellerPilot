"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { cn } from "@/lib/utils";

const MobileNavContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
} | null>(null);

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error("useMobileNav must be used within DashboardShell");
  return ctx;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>
      <div className="pnl-dashboard relative flex min-h-screen bg-background">
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity",
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform md:relative md:translate-x-0 md:z-auto",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <DashboardSidebar onNavigate={() => setOpen(false)} />
        </div>
        <div className="flex flex-1 flex-col min-w-0">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </MobileNavContext.Provider>
  );
}
