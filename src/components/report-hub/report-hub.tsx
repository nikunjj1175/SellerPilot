"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileSpreadsheet,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IndiaOrdersMap } from "@/components/dashboard/india-orders-map";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { formatINR, formatPct } from "@/lib/utils";
import type { ReportDetailData } from "@/lib/report-data";
import {
  statesForFilter,
  type StatusFilter,
} from "@/lib/meesho-analytics";
import { MEESHO_LABEL } from "@/types/enums";

const TAB_ITEMS = [
  { id: "ask-ai", label: "Ask AI" },
  { id: "overview", label: "Overview" },
  { id: "sku-mix", label: "SKU Mix" },
  { id: "state-spread", label: "State Spread" },
  { id: "status-mix", label: "Status Mix" },
  { id: "actions", label: "Actions" },
  { id: "metrics", label: "Metrics" },
  { id: "gst-breakdown", label: "GST Breakdown" },
  { id: "trend", label: "Trend" },
  { id: "sku-ranking", label: "SKU Ranking" },
  { id: "orders", label: "Orders" },
  { id: "export", label: "Export" },
] as const;

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "DELIVERED", label: "Delivered" },
  { id: "RTO", label: "RTO" },
  { id: "RETURN", label: "Return" },
  { id: "CANCELLED", label: "Cancelled" },
];

function Donut({
  data,
  center,
}: {
  data: { name: string; value: number; color: string }[];
  center: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative h-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => (total ? `${Number(v)} (${((Number(v) / total) * 100).toFixed(1)}%)` : "0")} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p className="text-xs text-center text-muted-foreground font-medium px-4">{center}</p>
      </div>
    </div>
  );
}

function SkuSnapshotCards({ snap }: { snap: ReportDetailData["analytics"]["skuSnapshot"] }) {
  const cards = [
    { label: "Total Unique SKUs", value: snap.total, sub: "SKU codes in report", tone: "" },
    { label: "Profit SKUs", value: snap.profit, sub: "Net profit above zero", tone: "text-emerald-600" },
    { label: "Loss SKUs", value: snap.loss, sub: "Need price or return review", tone: "text-red-500" },
    { label: "Near Zero SKUs", value: snap.nearZero, sub: "Within ±₹1 net result", tone: "text-muted-foreground" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`font-display text-3xl font-bold mt-1 ${c.tone}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-2">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReportHero({ data }: { data: ReportDetailData }) {
  const h = data.analytics.hero;
  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-primary/80 p-6 md:p-8 text-white shadow-xl">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            NET PROFIT (ex-GST)
          </div>
          <p className="font-display text-4xl md:text-5xl font-bold mt-2">{formatINR(h.netProfit)}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{h.marginPct.toFixed(2)}% margin</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{formatINR(h.avgPerOrder)} avg/order</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{h.skuCount} SKUs analysed</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-white/60 text-xs">Total payout</p>
              <p className="font-semibold">{formatINR(h.totalPayout)}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-white/60 text-xs">Net orders</p>
              <p className="font-semibold">{h.netOrders}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-white/60 text-xs">Loss SKUs</p>
              <p className="font-semibold text-red-300">{h.lossSkus}</p>
            </div>
          </div>
          <div className="hidden md:block text-center">
            <div className="relative h-24 w-24 rounded-full border-4 border-emerald-400/80 flex items-center justify-center">
              <div>
                <p className="text-2xl font-bold">{h.deliveredPct.toFixed(0)}%</p>
                <p className="text-[10px] text-white/70 uppercase">Delivered</p>
              </div>
            </div>
            <p className="text-xs text-white/60 mt-2">{h.grossOrders} order rows</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReportHub({
  data,
  credits = 0,
  defaultTab = "overview",
}: {
  data: ReportDetailData;
  credits?: number;
  defaultTab?: string;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("CANCELLED");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const perPage = 20;

  const filteredStates = useMemo(
    () => statesForFilter(data.orders, statusFilter),
    [data.orders, statusFilter]
  );

  const filteredOrders = useMemo(() => {
    const q = orderSearch.toLowerCase();
    return data.orders.filter(
      (o) =>
        !q ||
        o.orderId?.toLowerCase().includes(q) ||
        o.sku?.toLowerCase().includes(q) ||
        o.productName?.toLowerCase().includes(q)
    );
  }, [data.orders, orderSearch]);

  const pageOrders = filteredOrders.slice((orderPage - 1) * perPage, orderPage * perPage);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage));

  const revenueDonut = [
    { name: "Net Profit", value: Math.max(0, data.summary.netProfit), color: "#10b981" },
    { name: "Shipping", value: data.summary.shippingExGst ?? data.summary.shippingCharges, color: "#f97316" },
    { name: "Returns", value: data.summary.gstReturnTotal ?? data.summary.returnCharges, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const statusDonut = data.analytics.statusMix.map((s) => ({
    name: s.label,
    value: s.count,
    color: s.color,
  }));

  return (
    <div className="space-y-6">
      {data.isDemo && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-primary/10 p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display font-bold text-lg">Demo Report — {MEESHO_LABEL}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your 3 Meesho files (Orders + tcs_sales + tcs_sales_return) for real P&L, state map,
              SKU actions & AI insights.
            </p>
          </div>
          <Button asChild>
            <Link href="/register">
              Get started <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-primary font-medium">
            {MEESHO_LABEL} P&L Report
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold mt-1">{data.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(data.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {data.orderRowCount ? ` · ${data.orderRowCount} order rows` : ""}
          </p>
        </div>
        {!data.isDemo && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/reports">Back to Reports</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/product-costs?report=${data.id}`}>Edit SKU Costs</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/reports/${data.id}/export?format=excel`}>
                <FileSpreadsheet className="h-3 w-3 mr-1" />
                Excel
              </a>
            </Button>
          </div>
        )}
      </div>

      <ReportHero data={data} />

      <Tabs key={defaultTab ?? "overview"} defaultValue={defaultTab ?? "overview"} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto">
          {TAB_ITEMS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase text-primary font-medium">SKU Snapshot</p>
              <h2 className="font-display text-xl font-bold mt-1">SKU Count Summary</h2>
            </div>
            <SkuSnapshotCards snap={data.analytics.skuSnapshot} />
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="font-display">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  {data.analytics.monthlyMetrics.slice(0, 8).map((m) => (
                    <div key={m.label} className="rounded-xl border border-border/60 p-3">
                      <p className="text-muted-foreground text-xs">{m.label}</p>
                      <p className="font-display font-bold text-lg">{m.value}</p>
                      {m.sub && <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    State preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.ordersByState.length > 0 ? (
                    <IndiaOrdersMap data={data.ordersByState.slice(0, 10)} showTable={false} />
                  ) : (
                    <p className="text-sm text-muted-foreground">No state data in this report.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ask-ai">
          <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                PNL SATHI AI — Ask what to fix
              </CardTitle>
              <CardDescription>
                AI uses your full report context — profit, returns, RTO, GST & SKU mix.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.insights ? (
                data.isDemo ? (
                  <div className="space-y-4 text-sm">
                    <p>{data.insights.summary}</p>
                    <ul className="space-y-2">
                      {data.insights.products.slice(0, 5).map((p) => (
                        <li key={p.sku} className="rounded-lg border border-border p-3">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-muted-foreground"> — {p.metric}</span>
                          <p className="text-muted-foreground mt-1">{p.recommendation}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <InsightsPanel
                    reportId={data.id}
                    reportName={data.name}
                    insights={data.insights}
                    credits={credits}
                  />
                )
              ) : (
                <p className="text-muted-foreground text-sm">
                  Generate AI insights from the Insights tab after report processing.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sku-mix">
          <div className="space-y-6">
            <SkuSnapshotCards snap={data.analytics.skuSnapshot} />
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="font-display">Top SKUs by profit</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-2">SKU</th>
                      <th className="pb-2 pr-2">Sales</th>
                      <th className="pb-2">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.skuData.slice(0, 12).map((row) => (
                      <tr key={row.sku} className="border-b border-border/40">
                        <td className="py-2 pr-2 max-w-[140px] truncate">{row.sku}</td>
                        <td className="py-2 pr-2">{formatINR(row.sales)}</td>
                        <td className={`py-2 ${row.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {formatINR(row.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="state-spread">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="font-display">State Map Filter</CardTitle>
              <CardDescription>
                State-wise order spread. Filter by delivery status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6">
                <div className="flex flex-col gap-2 min-w-[120px]">
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStatusFilter(f.id)}
                      className={`rounded-xl px-4 py-3 text-sm font-medium text-left transition-colors ${
                        statusFilter === f.id
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted/60 hover:bg-muted"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex-1 min-w-[280px]">
                  <IndiaOrdersMap data={filteredStates} />
                </div>
                <div className="min-w-[160px]">
                  <p className="text-sm font-medium mb-3">Top states</p>
                  <ul className="space-y-2 text-sm">
                    {filteredStates.slice(0, 8).map((s) => (
                      <li key={s.state} className="flex justify-between">
                        <span>{s.state}</span>
                        <span className="font-medium">{s.orderCount}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status-mix">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="font-display">Revenue Split</CardTitle>
                <CardDescription>Payout components from Meesho GST files</CardDescription>
              </CardHeader>
              <CardContent>
                <Donut
                  data={revenueDonut}
                  center={`${formatINR(data.analytics.hero.totalPayout)} payout base`}
                />
                <ul className="mt-4 space-y-2 text-sm">
                  {[
                    ["Net Profit (ex-GST)", data.summary.netProfit, "#10b981"],
                    ["Shipping (ex-GST)", -(data.summary.shippingExGst ?? data.summary.shippingCharges), "#f97316"],
                    ["GST Returns", -(data.summary.gstReturnTotal ?? data.summary.returnCharges), "#ef4444"],
                  ].map(([label, val, color]) => (
                    <li key={String(label)} className="flex justify-between items-center rounded-lg border px-3 py-2">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: String(color) }} />
                        {label}
                      </span>
                      <span className="font-medium">{formatINR(Math.abs(Number(val)))}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="font-display">Order Status</CardTitle>
                <CardDescription>Delivered, RTO, return, cancelled mix</CardDescription>
              </CardHeader>
              <CardContent>
                <Donut
                  data={statusDonut}
                  center={`${data.analytics.hero.grossOrders} order rows`}
                />
                <ul className="mt-4 space-y-2 text-sm">
                  {data.analytics.statusMix.map((s) => (
                    <li key={s.label} className="flex justify-between items-center rounded-lg border px-3 py-2">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                        {s.label}
                      </span>
                      <span>
                        {s.count} ({s.pct.toFixed(1)}%)
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actions">
          <Card className="rounded-2xl">
            <CardHeader>
              <p className="text-xs uppercase text-primary font-medium">Decision Support</p>
              <CardTitle className="font-display">Action Plan</CardTitle>
              <CardDescription>SKUs ranked by priority — fix losses first.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground text-xs uppercase">
                    <th className="pb-2 pr-3">#</th>
                    <th className="pb-2 pr-3">SKU</th>
                    <th className="pb-2 pr-3">Action</th>
                    <th className="pb-2 pr-3">Net Result</th>
                    <th className="pb-2 pr-3">Margin</th>
                    <th className="pb-2 pr-3">Return %</th>
                    <th className="pb-2">Why</th>
                  </tr>
                </thead>
                <tbody>
                  {data.analytics.actionPlan.map((row) => (
                    <tr key={row.priority} className="border-b border-border/40">
                      <td className="py-3 pr-3">#{row.priority}</td>
                      <td className="py-3 pr-3 font-mono text-xs">{row.sku}</td>
                      <td className="py-3 pr-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.badge === "danger"
                              ? "bg-red-100 text-red-700"
                              : row.badge === "warning"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {row.action}
                        </span>
                      </td>
                      <td className={`py-3 pr-3 ${row.netResult >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {formatINR(row.netResult)}
                      </td>
                      <td className="py-3 pr-3">{formatPct(row.marginPct)}</td>
                      <td className="py-3 pr-3">{formatPct(row.returnPct)}</td>
                      <td className="py-3 text-muted-foreground max-w-[200px]">{row.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <div>
            <p className="text-xs uppercase text-primary font-medium">Core Metrics</p>
            <h2 className="font-display text-xl font-bold mt-1 mb-4">Monthly Summary</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.analytics.monthlyMetrics.map((m) => (
                <Card key={m.label} className="rounded-2xl">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="font-display text-2xl font-bold mt-1">{m.value}</p>
                    {m.sub && <p className="text-xs text-muted-foreground mt-2">{m.sub}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gst-breakdown">
          <Card className="rounded-2xl max-w-lg">
            <CardHeader>
              <CardTitle className="font-display">GST Breakdown</CardTitle>
              <CardDescription>Output GST from Meesho tcs files (informational)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                ["Output GST (payable)", -data.analytics.gstBreakdown.outputGst, "text-red-500"],
                ["Return GST", data.analytics.gstBreakdown.returnGst, "text-emerald-600"],
                ["Net GST impact", data.analytics.gstBreakdown.netGst, "text-red-500 font-bold"],
              ].map(([label, val, cls]) => (
                <div key={String(label)} className="flex justify-between border-b py-3">
                  <span>{label}</span>
                  <span className={String(cls)}>{formatINR(Math.abs(Number(val)))}</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                Net profit is calculated ex-GST. GST is shown separately for filing reference.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="font-display">Daily Trend</CardTitle>
              <CardDescription>Day-wise orders, sales & net profit</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data.analytics.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#6366f1" dot={false} name="Orders" />
                  <Line yAxisId="right" type="monotone" dataKey="sales" stroke="#3b82f6" dot={false} name="Sales ₹" />
                  <Line yAxisId="right" type="monotone" dataKey="profit" stroke="#10b981" dot={false} name="Profit ₹" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sku-ranking">
          <div className="grid gap-6 lg:grid-cols-2">
            {(["topProfit", "topLoss"] as const).map((key) => (
              <Card key={key} className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="font-display">
                    {key === "topProfit" ? "Top Profit SKUs" : "Top Loss SKUs"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-2">SKU</th>
                        <th className="pb-2 pr-2">Action</th>
                        <th className="pb-2 pr-2">Sales</th>
                        <th className="pb-2">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.analytics.skuRanking[key].map((row) => (
                        <tr key={row.sku} className="border-b border-border/40">
                          <td className="py-2 pr-2 font-mono text-xs">{row.sku}</td>
                          <td className="py-2 pr-2">
                            <span className="text-xs rounded-full bg-muted px-2 py-0.5">{row.action}</span>
                          </td>
                          <td className="py-2 pr-2">{formatINR(row.sales)}</td>
                          <td className={`py-2 ${row.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {formatINR(row.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="rounded-2xl">
            <CardHeader>
              <p className="text-xs uppercase text-primary font-medium">Order Explorer</p>
              <CardTitle className="font-display">Order-wise Preview</CardTitle>
              <CardDescription>
                Showing {pageOrders.length} of {filteredOrders.length} rows · Page {orderPage} of {totalPages}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search SKU, product or sub-order..."
                value={orderSearch}
                onChange={(e) => {
                  setOrderSearch(e.target.value);
                  setOrderPage(1);
                }}
              />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground text-xs uppercase">
                      <th className="pb-2 pr-3">Sub Order</th>
                      <th className="pb-2 pr-3">SKU</th>
                      <th className="pb-2 pr-3">Product</th>
                      <th className="pb-2 pr-3">Status</th>
                      <th className="pb-2 pr-3">State</th>
                      <th className="pb-2 pr-3">Taxable</th>
                      <th className="pb-2 pr-3">GST</th>
                      <th className="pb-2">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageOrders.map((o, i) => (
                      <tr key={o.orderId ?? i} className="border-b border-border/40">
                        <td className="py-2 pr-3 font-mono text-xs max-w-[120px] truncate">{o.orderId ?? "—"}</td>
                        <td className="py-2 pr-3">{o.sku ?? "—"}</td>
                        <td className="py-2 pr-3 max-w-[140px] truncate">{o.productName}</td>
                        <td className="py-2 pr-3">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{o.orderStatus ?? "—"}</span>
                        </td>
                        <td className="py-2 pr-3">{o.state ?? "—"}</td>
                        <td className="py-2 pr-3">{formatINR(o.saleAmount)}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{formatINR(o.gst)}</td>
                        <td className={`py-2 ${o.netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {formatINR(o.netProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={orderPage <= 1}
                  onClick={() => setOrderPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={orderPage >= totalPages}
                  onClick={() => setOrderPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card className="rounded-2xl max-w-md">
            <CardHeader>
              <CardTitle className="font-display">Export Report</CardTitle>
              <CardDescription>Download Excel with order-wise & SKU breakdown</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {data.isDemo ? (
                <p className="text-sm text-muted-foreground">
                  Register and upload your Meesho files to export real reports.
                </p>
              ) : (
                <Button asChild>
                  <a href={`/api/reports/${data.id}/export?format=excel`}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Download Excel
                  </a>
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/demo-report">View demo report</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
