"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  BarChart3,
  CreditCard,
  LogOut,
  Package,
  TrendingUp,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainLinks = [
  { href: "/dashboard/reports", label: "My Reports", icon: BarChart3 },
];

const opsLinks = [{ href: "/dashboard/product-costs", label: "Product Costs", icon: Package }];

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
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all border-l-[3px]",
        active
          ? "bg-amber-100/80 text-foreground font-semibold border-amber-500"
          : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card p-4">
      <Link href="/dashboard/reports" className="mb-8 flex items-center gap-2.5 px-2" onClick={onNavigate}>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <TrendingUp className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <span className="font-display font-bold block text-foreground">SellerPilot</span>
          <span className="text-[10px] text-muted-foreground">The Meesho P&L Companion</span>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-6">
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
            Main
          </p>
          <div className="flex flex-col gap-0.5">
            {mainLinks.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
            Operations
          </p>
          <div className="flex flex-col gap-0.5">
            {opsLinks.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
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
        <LogOut className="h-4 w-4" />
        Logout
      </button>

      {session?.user?.role === "ADMIN" && (
        <Link
          href="/admin"
          onClick={onNavigate}
          className="mt-2 text-xs text-muted-foreground hover:text-primary px-3"
        >
          Admin panel
        </Link>
      )}
    </aside>
  );
}
