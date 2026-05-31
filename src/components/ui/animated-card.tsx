"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AnimatedCardProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  glow?: boolean;
};

export function AnimatedCard({ children, className, delay = 0, glow = false }: AnimatedCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 p-6 shadow-lg shadow-primary/5",
        "transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/15",
        "animate-fade-up opacity-0 [animation-fill-mode:forwards]",
        glow && "ring-1 ring-primary/20",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--primary) 25%, transparent), transparent 50%, color-mix(in srgb, #a78bfa 20%, transparent))",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
