import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const productLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "/demo-report", label: "Sample report" },
];

const useCaseLinks = [
  { href: "#features", label: "SKU profit" },
  { href: "#features", label: "Payout view" },
  { href: "#features", label: "Returns & RTO" },
  { href: "#features", label: "GST P&L" },
];

const companyLinks = [
  { href: "/register", label: "Create account" },
  { href: "/login", label: "Login" },
  { href: "/dashboard/product-costs", label: "Product costs" },
];

export function LandingFooter() {
  return (
    <footer className="bg-surface-darker text-white/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 md:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo href="/" size="sm" variant="onDark" className="mb-4" />
            <p className="text-sm text-white/70 leading-relaxed max-w-xs">
              Built for Indian Meesho sellers who want clear monthly profit — not spreadsheet guesswork.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-4">Product</p>
            <ul className="space-y-2 text-sm">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-white/75 hover:text-white transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-4">Use cases</p>
            <ul className="space-y-2 text-sm">
              {useCaseLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-white/75 hover:text-white transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-4">Account</p>
            <ul className="space-y-2 text-sm">
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-white/75 hover:text-white transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-xs text-white/50">
          <p>© {new Date().getFullYear()} SellerPilot. All rights reserved.</p>
          <p>Not affiliated with Meesho.</p>
        </div>
      </div>
    </footer>
  );
}
