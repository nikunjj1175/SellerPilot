"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BarChart3,
  CreditCard,
  FileSpreadsheet,
  LayoutDashboard,
  MapPin,
  Package,
  Sparkles,
  Shield,
  RotateCcw,
  Settings,
  Truck,
  Wallet,
  Plug,
  Building2,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/reports", label: "Reports", icon: FileSpreadsheet },
  { href: "/demo-report", label: "Demo Report", icon: Sparkles },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
  { href: "/dashboard/agency", label: "Agency", icon: Building2 },
  { href: "/dashboard/developer", label: "Developer API", icon: Code2 },
  { href: "/dashboard/insights", label: "AI Insights", icon: Sparkles },
  { href: "/dashboard/analytics", label: "P&L Analytics", icon: BarChart3 },
  { href: "/dashboard/states", label: "State Map", icon: MapPin },
  { href: "/dashboard/sku", label: "SKU Analytics", icon: Package },
  { href: "/dashboard/returns", label: "Returns", icon: RotateCcw },
  { href: "/dashboard/rto", label: "RTO", icon: Truck },
  { href: "/dashboard/credits", label: "Credits", icon: Wallet },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Shield, adminOnly: true },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const visibleLinks = links.filter((l) => !("adminOnly" in l && l.adminOnly) || isAdmin);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/50 p-4 md:block">
      <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          S
        </div>
        <span className="font-display font-semibold">SellerPilot</span>
      </Link>
      <nav className="flex flex-col gap-1">
        {visibleLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === href
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
