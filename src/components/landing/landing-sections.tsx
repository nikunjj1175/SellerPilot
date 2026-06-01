import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  FileSpreadsheet,
  IndianRupee,
  LineChart,
  Link2,
  Package,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Tag,
  Target,
  X,
  Zap,
  Minus,
  HeadphonesIcon,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewsSection, FaqSection } from "@/components/landing/landing-sections-client";

export function LandingSections() {
  return (
    <>
      <section className="relative overflow-hidden py-16 md:py-24 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 mb-6">
            <Zap className="h-3.5 w-3.5" />
            Manual upload — 3 Meesho files · full P&L in minutes
          </span>
          <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Know your real Meesho profit in minutes
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
            Generate a Meesho-specific P&L report with SKU profit, payout view, returns/RTO
            impact, GST breakdown and next actions. Upload Orders + GST files — add product costs
            for true net profit.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-4">
            <Button size="lg" asChild className="h-12 rounded-full px-8 text-base shadow-lg">
              <Link href="/register">
                Generate My P&L Report
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 rounded-full px-8 border-primary/30">
              <Link href="/demo-report">
                <LineChart className="mr-2 h-4 w-4" />
                View Sample Report
              </Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {["P", "R", "A", "M"].map((l, i) => (
                <span
                  key={l}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-card text-xs font-bold text-white"
                  style={{ background: ["#7c3aed", "#8b5cf6", "#6d28d9", "#5b21b6"][i] }}
                >
                  {l}
                </span>
              ))}
            </div>
            <div className="text-left text-sm">
              <p className="text-primary font-medium">★★★★★</p>
              <p className="text-muted-foreground">Trusted by Meesho sellers</p>
            </div>
          </div>
          <div className="mt-16 mx-auto max-w-4xl">
            <div className="rounded-2xl border border-border bg-surface-darker p-2 shadow-2xl">
              <div className="rounded-xl bg-violet-950 p-4 md:p-6 text-left">
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-[10px] text-white/40 font-mono truncate">
                    sellerpilot.com/demo-report
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Payout", value: "₹2.08L" },
                    { label: "Net profit", value: "₹38K", green: true },
                    { label: "Loss SKUs", value: "9", red: true },
                    { label: "RTO impact", value: "24%" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
                      <p className="text-[10px] uppercase text-white/50">{m.label}</p>
                      <p className={`text-xl font-semibold mt-1 ${m.green ? "text-emerald-400" : m.red ? "text-red-400" : "text-white"}`}>
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-dark text-white py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "895+", label: "Order rows analysed" },
            { value: "₹2.08L", label: "Payout reconciled" },
            { value: "₹38K+", label: "Real profit surfaced" },
            { value: "24%", label: "RTO impact visible" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-semibold text-3xl md:text-4xl font-bold">{s.value}</p>
              <p className="text-sm opacity-70 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <ReviewsSection />

      <section className="py-16 md:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold px-4 py-1.5 mb-4">
              What you will know fast
            </span>
            <h2 className="font-semibold text-3xl md:text-4xl font-bold">
              What you can decide in the first 10 minutes
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: Tag, title: "Which SKUs deserve more budget", text: "Healthy real margin, not just sales." },
              { icon: Search, title: "Where cash is leaking", text: "Returns and RTO killing margin." },
              { icon: IndianRupee, title: "Settlement clarity", text: "Payout vs taxable sales per order." },
              { icon: FileSpreadsheet, title: "GST & net profit", text: "Output GST separate from profit." },
              { icon: Target, title: "What to fix or scale", text: "Action Plan ranks every SKU." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5">
                <Icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold font-bold text-sm">{title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-16 md:py-24 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block rounded-full bg-accent text-primary text-xs font-semibold px-4 py-1.5 mb-4">
              Why sellers switch
            </span>
            <h2 className="font-semibold text-3xl md:text-4xl font-bold">
              Built for real Meesho pain points
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: LineChart, title: "True SKU Profit Engine", text: "After returns, RTO, GST and product cost." },
              { icon: Search, title: "Return & RTO Reality", text: "Fulfillment impact on true margin." },
              { icon: Link2, title: "3-File Meesho Merge", text: "Orders + tcs_sales + tcs_return merged." },
              { icon: RefreshCw, title: "State-wise Map", text: "India map with status filters." },
              { icon: BarChart3, title: "GST Breakdown", text: "Output GST with ex-GST profit." },
              { icon: Zap, title: "Action Plan", text: "Fix, stop or scale SKUs ranked by net result." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold font-bold mt-4">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px] rounded-2xl border border-border bg-card overflow-hidden">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4">Capability</th>
                <th className="p-4 text-center">Manual Excel</th>
                <th className="p-4 text-center">Accountant</th>
                <th className="p-4 text-center bg-primary/10 text-primary">SellerPilot</th>
              </tr>
            </thead>
            <tbody>
              {[
                "SKU profit after returns & GST",
                "Meesho 3-file merge",
                "State order map",
                "Product cost → net profit",
              ].map((cap) => (
                <tr key={cap} className="border-b border-border/60">
                  <td className="p-4">{cap}</td>
                  <td className="p-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Minus className="h-5 w-5 text-violet-400 mx-auto" /></td>
                  <td className="p-4 text-center bg-primary/5"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-surface-dark text-white p-8">
            <h2 className="font-semibold text-2xl font-bold">Before vs After one upload</h2>
            <p className="mt-4 text-sm opacity-75">See loss SKUs and true net profit — not guesswork.</p>
            <div className="mt-6 rounded-2xl bg-white/10 p-5">
              <p className="text-xs opacity-60 uppercase">Example</p>
              <p className="font-semibold text-3xl font-bold text-emerald-300 mt-1">₹18,200+</p>
              <p className="text-sm opacity-70 mt-2">Saved by fixing loss SKUs from Action Plan.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8">
            <p className="text-xs uppercase text-primary font-semibold">SKU cost sync</p>
            <h3 className="font-semibold font-bold text-lg mt-2">Product & pack cost once</h3>
            <p className="text-sm text-muted-foreground mt-2">Update costs per SKU — net profit updates instantly.</p>
            <Button variant="outline" className="mt-4 rounded-full" asChild>
              <Link href="/dashboard/product-costs">Open Product Costs</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 md:py-24 bg-muted/30 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-surface-dark text-white p-8">
            <h3 className="font-semibold text-xl font-bold">Upload 3 Meesho files</h3>
            <ol className="mt-6 space-y-3 text-sm">
              {["Orders CSV", "tcs_sales.xlsx", "tcs_sales_return.xlsx", "Open full P&L report"].map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#faf6f0] text-violet-900 font-bold text-xs">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8">
            <h3 className="font-semibold text-xl font-bold">Add product costs</h3>
            <ol className="mt-6 space-y-3 text-sm">
              {["Open Product Costs", "Fill purchase + pack price", "Save Changes", "See true net profit"].map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
            <Button className="mt-8 rounded-full" asChild><Link href="/register">Start free</Link></Button>
          </div>
        </div>
      </section>

      <section id="workflow" className="py-16 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid md:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: "Fast upload", text: "3 files monthly — report in minutes." },
            { icon: Package, title: "Product costs", text: "SKU sheet for proper net profit." },
            { icon: Sparkles, title: "Full tabs", text: "AI, map, GST, trend, orders." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border bg-card p-6 text-center">
              <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-bold">{title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <FaqSection />

      <section id="pricing" className="py-16 md:py-24 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-[1.2fr_1fr] gap-8">
          <div className="rounded-3xl border-2 border-primary/30 bg-card p-8 shadow-lg">
            <h3 className="font-semibold text-xl font-bold">Monthly Meesho P&L</h3>
            <p className="font-semibold text-5xl font-extrabold mt-4">2 <span className="text-lg font-normal text-muted-foreground">credits</span></p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button size="lg" className="rounded-full" asChild><Link href="/register">Start First Report</Link></Button>
              <Button size="lg" variant="outline" className="rounded-full" asChild><Link href="/demo-report">Sample Report</Link></Button>
            </div>
            <ul className="mt-8 space-y-2 text-sm">
              {["SKU profit + product costs", "State map + GST", "Excel export"].map((i) => (
                <li key={i} className="flex gap-2"><Check className="h-4 w-4 text-emerald-600" />{i}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            {[
              { icon: Briefcase, title: "For Meesho sellers", text: "Not generic spreadsheets." },
              { icon: HeadphonesIcon, title: "Upload guide", text: "Help for GST file downloads." },
              { icon: Shield, title: "Secure", text: "Protected dashboard & sessions." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border bg-card p-5 flex gap-4">
                <Icon className="h-8 w-8 text-primary shrink-0" />
                <div><h3 className="font-bold">{title}</h3><p className="text-sm text-muted-foreground">{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-surface-dark text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-semibold text-3xl md:text-4xl font-bold">Stop guessing margins. Run Meesho with clarity.</h2>
          <p className="mt-4 opacity-75">Upload once, add product costs, decide with confidence.</p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
              <Link href="/register">Start Your Report</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
