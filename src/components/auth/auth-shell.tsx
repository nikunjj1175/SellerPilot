import Link from "next/link";
import { MeshBackground } from "@/components/landing/mesh-background";
import type { ReactNode } from "react";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <MeshBackground />
      <div className="w-full max-w-md animate-fade-up opacity-0 [animation-fill-mode:forwards]">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-display text-xl font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-primary-foreground shadow-lg shadow-primary/30">
            S
          </span>
          SellerPilot
        </Link>
        <div className="glass rounded-2xl border border-border/80 p-8 shadow-2xl shadow-primary/10">
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
