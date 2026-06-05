"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  CreditCard,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Shield,
  Tag,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: FileSpreadsheet },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
];

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: (typeof links)[0];
  pathname: string;
  onNavigate?: () => void;
}) {
  const active =
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

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

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card p-4">
      <div className="mb-6 px-1">
        <Logo href="/admin" size="md" onClick={onNavigate} />
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2.5 py-1">
          <Shield className="h-3 w-3" aria-hidden />
          Admin panel
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 text-sm">
        <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Management
        </p>
        {links.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </nav>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground w-full text-left border border-border/60"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Logout
      </button>
    </aside>
  );
}
