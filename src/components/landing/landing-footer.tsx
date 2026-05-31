import Link from "next/link";
import { TrendingUp } from "lucide-react";

const productLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "Why SellerPilot" },
  { href: "#pricing", label: "Pricing" },
  { href: "/demo-report", label: "Sample Report" },
];

const useCaseLinks = [
  { href: "#features", label: "SKU profit tracking" },
  { href: "#features", label: "Payout reconciliation" },
  { href: "#features", label: "Return & RTO impact" },
  { href: "#features", label: "GST-aware monthly P&L" },
];

const companyLinks = [
  { href: "/register", label: "Create account" },
  { href: "/login", label: "Login" },
  { href: "/dashboard/product-costs", label: "Product Costs" },
];

export function LandingFooter() {
  return (
    <footer className="bg-brown-darker text-[#faf6f0]/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <p className="font-display font-bold">SellerPilot</p>
                <p className="text-[10px] uppercase tracking-widest opacity-60">
                  The Meesho P&L Companion
                </p>
              </div>
            </div>
            <p className="text-sm opacity-70 leading-relaxed max-w-xs">
              Built for Indian Meesho sellers who want exact monthly profit visibility — not
              approximate spreadsheet comfort.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-4">
              Product
            </p>
            <ul className="space-y-2 text-sm">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="opacity-75 hover:opacity-100 transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-4">
              Use Cases
            </p>
            <ul className="space-y-2 text-sm">
              {useCaseLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="opacity-75 hover:opacity-100 transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-4">
              Company
            </p>
            <ul className="space-y-2 text-sm">
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="opacity-75 hover:opacity-100 transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-4 text-xs opacity-50">
          <p>© {new Date().getFullYear()} SellerPilot. All rights reserved.</p>
          <p>Not affiliated with Meesho. Built to help sellers understand real profitability.</p>
        </div>
      </div>
    </footer>
  );
}
