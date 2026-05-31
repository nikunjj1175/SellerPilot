"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  CreditCard,
  FileSpreadsheet,
  LayoutDashboard,
  Sparkles,
  Shield,
  Settings,
  Wallet,
  Plug,
  Building2,
  Code2,
  Package,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const mainLinks: NavItem[] = [
  { href: "/dashboard/reports", label: "My Reports", icon: FileSpreadsheet },
  { href: "/demo-report", label: "Sample Report", icon: Sparkles },
];

const opsLinks: NavItem[] = [
  { href: "/dashboard/product-costs", label: "Product Costs", icon: Package },
  { href: "/dashboard/integrations", label: "Upload Guide", icon: Plug },
];

const accountLinks: NavItem[] = [
  { href: "/dashboard/credits", label: "Payments", icon: Wallet },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Profile", icon: Settings },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all border-l-[3px]",
        active
          ? "bg-amber-500/15 text-foreground font-medium border-amber-500"
          : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/80 p-4 md:flex md:flex-col">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-primary-foreground font-bold shadow">
          S
        </div>
        <div>
          <span className="font-display font-semibold block leading-tight">SellerPilot</span>
          <span className="text-[10px] text-muted-foreground">Meesho P&L Companion</span>
        </div>
      </Link>

      <nav className="flex flex-col gap-6 flex-1">
        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Main
          </p>
          <div className="flex flex-col gap-0.5">
            <NavLink item={{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }} pathname={pathname} />
            {mainLinks.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Operations
          </p>
          <div className="flex flex-col gap-0.5">
            {opsLinks.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
            <NavLink item={{ href: "/dashboard/agency", label: "Agency", icon: Building2 }} pathname={pathname} />
            <NavLink item={{ href: "/dashboard/developer", label: "API", icon: Code2 }} pathname={pathname} />
          </div>
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Account
          </p>
          <div className="flex flex-col gap-0.5">
            {accountLinks.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
            {isAdmin && (
              <NavLink item={{ href: "/admin", label: "Admin", icon: Shield, adminOnly: true }} pathname={pathname} />
            )}
          </div>
        </div>
      </nav>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </aside>
  );
}
