import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

export function AuthShell({
  children,
  title,
  subtitle,
  footerLink,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  footerLink?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:py-12 bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/50 via-background to-muted/30 pointer-events-none" />
      <div className="relative w-full max-w-md animate-fade-up opacity-0 [animation-fill-mode:forwards]">
        <div className="rounded-2xl border border-border bg-card shadow-xl p-6 sm:p-8 md:p-10">
          <div className="flex items-start justify-between gap-4 mb-6">
            <Logo href="/" size="sm" />
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground text-2xl leading-none p-1"
              aria-label="Back to home"
            >
              ×
            </Link>
          </div>
          <h1 className="h1 text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {footerLink && <div className="mt-6 text-center text-sm">{footerLink}</div>}
        </div>
      </div>
    </div>
  );
}
