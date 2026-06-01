"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

const REVIEWS = [
  {
    quote: "Very simple, easy to understand. Finally know which SKUs are actually profitable.",
    name: "Mayank Rai",
    period: "April 2026 report",
    tag: "Understood real profit",
    initial: "M",
  },
  {
    quote: "Excellent and very useful tool. Found loss SKUs I was still advertising on.",
    name: "Amora Attire",
    period: "March 2026 report",
    tag: "Found loss SKUs",
    initial: "A",
  },
  {
    quote: "GST breakdown and product cost sheet saved hours every month-end.",
    name: "Nikunj Patel",
    period: "Meesho seller",
    tag: "Spotted GST issues",
    initial: "N",
  },
];

export function ReviewsSection() {
  const [idx, setIdx] = useState(0);
  const visible = REVIEWS.slice(idx, idx + 2);
  if (visible.length === 1 && idx > 0) visible.unshift(REVIEWS[idx - 1]);

  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="grid lg:grid-cols-[minmax(280px,360px)_1fr]">
            <div className="bg-surface-dark text-white p-8 md:p-10 flex flex-col justify-between min-h-[320px]">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60 font-semibold mb-3">
                  Seller Reviews
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold leading-tight">
                  Real sellers are finding real profit leaks
                </h2>
                <p className="mt-4 text-sm text-white/75 leading-relaxed">
                  Reviews from Meesho sellers after checking SKU profit, payout matching, returns,
                  RTO and next-month actions inside SellerPilot.
                </p>
              </div>
              <div className="mt-8 space-y-4">
                <div className="inline-block rounded-xl bg-white/10 px-4 py-3">
                  <p className="text-3xl font-semibold">5.0</p>
                  <p className="text-xs text-white/60">Average rating from report users</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-500/20 text-emerald-200 text-xs px-3 py-1">
                    Reviews from report users
                  </span>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-200 text-xs px-3 py-1">
                    Based on unlocked P&L reports
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-muted/30">
              <div className="grid sm:grid-cols-2 gap-4">
                {REVIEWS.slice(idx, idx + 2).map((r) => (
                  <div
                    key={r.name}
                    className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-0.5 text-primary text-sm">★★★★★</div>
                      <Quote className="h-5 w-5 text-primary/40" />
                    </div>
                    <p className="font-semibold text-sm leading-snug">&ldquo;{r.quote}&rdquo;</p>
                    <div className="flex items-center gap-3 mt-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-sm">
                        {r.initial}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.period}</p>
                      </div>
                    </div>
                    <span className="inline-block mt-3 rounded-full bg-accent text-primary text-xs px-3 py-1 font-medium">
                      {r.tag}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-6">
                <div className="flex gap-1.5">
                  {REVIEWS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIdx(i)}
                      className={cn(
                        "h-2 rounded-full transition-all",
                        i === idx ? "w-6 bg-primary" : "w-2 bg-border"
                      )}
                      aria-label={`Review ${i + 1}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIdx((i) => Math.max(0, i - 1))}
                    disabled={idx === 0}
                    className="rounded-lg border border-border p-2 hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdx((i) => Math.min(REVIEWS.length - 1, i + 1))}
                    disabled={idx >= REVIEWS.length - 1}
                    className="rounded-lg border border-border p-2 hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    q: "What is a Meesho profit and loss calculator?",
    a: "SellerPilot merges your Orders CSV, tcs_sales and tcs_sales_return files into one monthly P&L — showing real profit after shipping, returns, RTO and product costs.",
  },
  {
    q: "Why is Meesho payout not the same as profit?",
    a: "Payout is what Meesho pays you. Profit is payout minus product cost, packaging, returns impact, shipping and GST effects. SellerPilot shows both clearly.",
  },
  {
    q: "Can SellerPilot show SKU-wise profit and loss?",
    a: "Yes. SKU Mix, SKU Ranking and Action Plan tabs rank every SKU by net result so you know what to scale or stop.",
  },
  {
    q: "Does the report include returns, RTO and exchanges?",
    a: "Yes. Status Mix and state map filters show delivered, RTO, return, cancelled and exchange counts from your Orders file.",
  },
  {
    q: "Do I need GST knowledge to use the report?",
    a: "No. GST Breakdown shows output GST and net impact in plain numbers. Profit is calculated ex-GST so it stays easy to read.",
  },
  {
    q: "What costs should I add for accurate profit?",
    a: "Add product purchase price (incl. GST) and packaging cost per SKU in Product Costs. Save once — profit updates across the report.",
  },
  {
    q: "Can I download or share the report?",
    a: "Yes. Export Excel from any completed report. PDF export is also available from the report page.",
  },
  {
    q: "Who is SellerPilot best for?",
    a: "Meesho sellers doing 100+ orders/month who want to know if they actually made money — not just what sales looked like.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 md:py-24 bg-background scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold px-4 py-1.5 mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Questions Meesho sellers ask before trusting their P&L
          </h2>
          <p className="mt-4 text-muted-foreground">
            SellerPilot turns messy orders, payments, returns, GST and SKU costs into a
            decision-ready monthly profit report.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-3 max-w-5xl mx-auto">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={item.q}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <button
                type="button"
                className="flex w-full items-start justify-between gap-4 p-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-sm leading-snug">{item.q}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-primary transition-transform",
                    open === i && "rotate-180"
                  )}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-4">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
