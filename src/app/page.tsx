import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  FileSpreadsheet,
  Shield,
  TrendingUp,
  Zap,
  Sparkles,
  Building2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCard } from "@/components/ui/animated-card";
import { MeshBackground } from "@/components/landing/mesh-background";

const features = [
  {
    icon: TrendingUp,
    title: "Real P&L",
    description: "Actual profit after commission, shipping, returns & RTO — not just revenue.",
  },
  {
    icon: FileSpreadsheet,
    title: "Multi-marketplace CSV",
    description: "Meesho, Flipkart, Amazon & Shopsy settlement files — one upload flow.",
  },
  {
    icon: BarChart3,
    title: "SKU Analytics",
    description: "Product-wise profit, return % and loss-making SKU alerts.",
  },
  {
    icon: MapPin,
    title: "State-wise Map",
    description: "Excel mathi State/Pincode → India map hover par ketla orders te state na.",
  },
  {
    icon: Building2,
    title: "Agency & API",
    description: "Manage 25+ client stores or automate uploads via REST API.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "₹299",
    period: "/month",
    features: ["10 reports/mo", "Basic analytics", "Email support"],
  },
  {
    name: "Growth",
    price: "₹999",
    period: "/month",
    features: ["50 reports/mo", "SKU analytics", "AI insights"],
    popular: true,
  },
  {
    name: "Agency",
    price: "₹2999",
    period: "/month",
    features: ["25 stores", "REST API", "Weekly digest"],
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <MeshBackground />

      <header className="sticky top-0 z-50 border-b border-border/60 glass">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-primary-foreground shadow-md shadow-primary/25 animate-pulse-glow">
              S
            </span>
            SellerPilot
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#features" className="text-muted-foreground transition hover:text-primary">
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground transition hover:text-primary">
              Pricing
            </a>
            <Link href="/demo-report" className="text-muted-foreground transition hover:text-primary">
              Demo Report
            </Link>
          </nav>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="shadow-lg shadow-primary/25">
              <Link href="/register">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-28 text-center md:py-32">
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary animate-fade-up opacity-0 [animation-fill-mode:forwards]"
          style={{ animationDelay: "100ms" }}
        >
          <Zap className="h-4 w-4" />
          Built for Indian marketplace sellers
        </div>
        <h1
          className="font-display mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl animate-fade-up opacity-0 [animation-fill-mode:forwards]"
          style={{ animationDelay: "200ms" }}
        >
          Know your real{" "}
          <span className="text-gradient">Meesho profit</span>
          <br className="hidden sm:block" />
          — not just sales
        </h1>
        <p
          className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground md:text-xl animate-fade-up opacity-0 [animation-fill-mode:forwards]"
          style={{ animationDelay: "350ms" }}
        >
          Upload settlement CSV. Get P&L, returns, RTO & SKU insights in minutes. Secure dashboard
          with credits, Razorpay & agency tools.
        </p>
        <div
          className="mt-12 flex flex-wrap justify-center gap-4 animate-fade-up opacity-0 [animation-fill-mode:forwards]"
          style={{ animationDelay: "500ms" }}
        >
          <Button size="lg" asChild className="h-12 px-8 text-base shadow-xl shadow-primary/30">
            <Link href="/register">
              <Sparkles className="mr-2 h-4 w-4" />
              Start free — 10 credits
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base glass">
            <Link href="/demo-report">View demo report</Link>
          </Button>
        </div>

        <div
          className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4 text-center animate-fade-up opacity-0 [animation-fill-mode:forwards]"
          style={{ animationDelay: "650ms" }}
        >
          {[
            { label: "Reports processed", value: "10K+" },
            { label: "Avg. setup time", value: "5 min" },
            { label: "Marketplaces", value: "4" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl glass px-4 py-3">
              <p className="font-display text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="border-t border-border/60 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-center text-3xl font-bold md:text-4xl">
            Everything you need to scale
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            From CSV upload to agency multi-store — one secure platform.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {features.map((f, i) => (
              <AnimatedCard key={f.title} delay={150 + i * 100} glow>
                <f.icon className="h-9 w-9 text-primary transition-transform duration-300 group-hover:scale-110" />
                <h3 className="font-display mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4">
          <AnimatedCard glow className="text-center">
            <Shield className="mx-auto h-10 w-10 text-primary" />
            <h3 className="font-display mt-4 text-xl font-bold">Enterprise-grade security</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
              Protected dashboard & APIs, rate limiting, signed webhooks, secure sessions, and
              security headers on every request.
            </p>
          </AnimatedCard>
        </div>
      </section>

      <section id="pricing" className="border-t border-border/60 bg-muted/20 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-center text-3xl font-bold md:text-4xl">Simple pricing</h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <AnimatedCard
                key={plan.name}
                delay={200 + i * 120}
                glow={plan.popular}
                className={plan.popular ? "border-primary/50 ring-2 ring-primary/20" : ""}
              >
                {plan.popular && (
                  <span className="mb-3 inline-block rounded-full bg-primary/15 px-3 py-0.5 text-xs font-semibold text-primary">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                <div className="mt-2 font-display text-4xl font-extrabold">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <span className="text-primary">✓</span> {feat}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full"
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href="/register">Get started</Link>
                </Button>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} SellerPilot — Meesho Seller Analytics & P&L
        </p>
        <p className="mt-1 text-xs">MongoDB · Vercel · Secure by design</p>
      </footer>
    </div>
  );
}
