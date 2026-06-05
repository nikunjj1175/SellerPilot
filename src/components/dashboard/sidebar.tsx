"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { BarChart3, CreditCard, LogOut, Package, User } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const mainLinks = [{ href: "/dashboard/reports", label: "My reports", icon: BarChart3 }];
const opsLinks = [{ href: "/dashboard/product-costs", label: "Product costs", icon: Package }];
const accountLinks = [
  { href: "/dashboard/credits", label: "Payments", icon: CreditCard },
  { href: "/dashboard/settings", label: "Profile", icon: User },
];

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: (typeof mainLinks)[0];
  pathname: string;
  onNavigate?: () => void;
}) {
  const active =
    pathname === item.href ||
    (item.href === "/dashboard/reports" &&
      (pathname.startsWith("/dashboard/reports") || pathname === "/dashboard"));

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors border-l-[3px]",
        active
          ? "bg-primary/10 text-primary font-medium border-primary"
          : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" aria-hidden />
      {item.label}
    </Link>
  );
}

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card p-4">
      <Logo href="/dashboard/reports" size="md" className="mb-8 px-1" onClick={onNavigate} />

      <nav className="flex flex-1 flex-col gap-5 text-sm">
        <div>
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Main
          </p>
          <div className="flex flex-col gap-0.5">
            {mainLinks.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Operations
          </p>
          <div className="flex flex-col gap-0.5">
            {opsLinks.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Account
          </p>
          <div className="flex flex-col gap-0.5">
            {accountLinks.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </nav>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground w-full text-left"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Logout
      </button>

    </aside>
  );
}
