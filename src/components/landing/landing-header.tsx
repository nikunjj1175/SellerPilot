"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#workflow", label: "Upload flow" },
  { href: "#faq", label: "FAQ" },
  { href: "#pricing", label: "Pricing" },
  { href: "/demo-report", label: "Sample report" },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo href="/" size="md" className="shrink-0" />

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {NAV.map((item) =>
            item.href.startsWith("#") ? (
              <a key={item.href} href={item.href} className="transition hover:text-primary">
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className="transition hover:text-primary">
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden sm:flex items-center gap-2">
          <Button variant="ghost" asChild className="rounded-lg">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="rounded-lg shadow-sm">
            <Link href="/register">Start free</Link>
          </Button>
        </div>

        <button
          type="button"
          className="lg:hidden rounded-lg p-2 text-foreground hover:bg-muted"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "lg:hidden border-t border-border bg-card overflow-hidden transition-all",
          open ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0 border-t-0"
        )}
      >
        <nav className="flex flex-col gap-0.5 p-4">
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
            <Button variant="outline" asChild className="rounded-lg w-full">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="rounded-lg w-full">
              <Link href="/register">Start free</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
