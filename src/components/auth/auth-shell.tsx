import Link from "next/link";
import type { ReactNode } from "react";

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
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12 bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-background to-muted/40 pointer-events-none" />
      <div className="relative w-full max-w-md animate-fade-up opacity-0 [animation-fill-mode:forwards]">
        <div className="rounded-3xl border border-border bg-card shadow-2xl p-8 md:p-10">
          <div className="flex items-start justify-between gap-4 mb-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow">
                S
              </span>
              <div>
                <span className="font-display font-bold block">SellerPilot</span>
                <span className="text-[10px] text-muted-foreground">Meesho P&L Companion</span>
              </div>
            </Link>
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground text-xl leading-none"
              aria-label="Close"
            >
              ×
            </Link>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {footerLink && <div className="mt-6 text-center">{footerLink}</div>}
        </div>
      </div>
    </div>
  );
}
