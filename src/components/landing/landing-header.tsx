"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#workflow", label: "Auto vs Manual" },
  { href: "#faq", label: "FAQ" },
  { href: "#pricing", label: "Pricing" },
  { href: "/demo-report", label: "Sample Report" },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <span className="font-display block text-base font-bold text-foreground">SellerPilot</span>
            <span className="text-[10px] text-muted-foreground tracking-wide">
              The Meesho P&L Companion
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          {NAV.map((item) =>
            item.href.startsWith("#") ? (
              <a
                key={item.href}
                href={item.href}
                className="text-muted-foreground transition hover:text-primary"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground transition hover:text-primary"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden sm:flex items-center gap-2">
          <Button variant="ghost" asChild className="rounded-full">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="rounded-full shadow-md px-5">
            <Link href="/register">Start Your Report</Link>
          </Button>
        </div>

        <button
          type="button"
          className="lg:hidden rounded-lg p-2 hover:bg-muted"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={cn(
          "lg:hidden border-t border-border bg-card overflow-hidden transition-all",
          open ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0 border-t-0"
        )}
      >
        <nav className="flex flex-col gap-1 p-4">
          {NAV.map((item) =>
            item.href.startsWith("#") ? (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
              >
                {item.label}
              </Link>
            )
          )}
          <div className="flex flex-col gap-2 pt-3 border-t border-border mt-2">
            <Button variant="outline" asChild className="rounded-full w-full">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="rounded-full w-full">
              <Link href="/register">Start Your Report</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
