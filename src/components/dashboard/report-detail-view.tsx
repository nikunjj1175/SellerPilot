import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  FileSpreadsheet,
  MapPin,
  Package,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IndiaOrdersMap } from "@/components/dashboard/india-orders-map";
import { ProfitChart } from "@/components/dashboard/profit-chart";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { formatINR, formatPct } from "@/lib/utils";
import type { ReportDetailData } from "@/lib/report-data";

export function ReportDetailView({
  data,
  credits = 0,
}: {
  data: ReportDetailData;
  credits?: number;
}) {
  const s = data.summary;

  const waterfall = [
    { name: "Revenue", amount: s.grossRevenue },
    {
      name: "Charges",
      amount: -(s.marketplaceCharges + s.shippingCharges + s.returnCharges + s.rtoLoss + s.gstImpact),
    },
    { name: "Net Profit", amount: s.netProfit },
  ];

  return (
    <div className="space-y-6">
      {data.isDemo && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-primary/10 p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display font-bold text-lg">📊 Demo Report Preview</p>
            <p className="text-sm text-muted-foreground mt-1">
              Purchase credits & upload your CSV to get this full report with your real data — P&L,
              state map, SKU, returns, RTO & AI insights.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/register">Register free</Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                Buy credits <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-primary font-medium">
            {data.marketplace} · {data.isDemo ? "Demo" : "Report"}
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold mt-1">{data.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(data.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        {!data.isDemo && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/reports/${data.id}/export?format=excel`}>
                <FileSpreadsheet className="h-3 w-3 mr-1" />
                Excel
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/insights?report=${data.id}`}>
                <Sparkles className="h-3 w-3 mr-1" />
                AI
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Revenue", value: formatINR(s.grossRevenue), icon: TrendingUp },
          {
            label: "Net Profit",
            value: formatINR(s.netProfit),
            highlight: s.netProfit < 0 ? "text-red-500" : "text-emerald-600",
            icon: BarChart3,
          },
          { label: "Orders", value: String(s.totalOrders), icon: Package },
          { label: "Return %", value: formatPct(s.returnRate), icon: Package },
          { label: "RTO %", value: formatPct(s.rtoRate), icon: Package },
        ].map(({ label, value, highlight, icon: Icon }) => (
          <Card key={label} className="glass">
            <CardContent className="pt-4 pb-4">
              <Icon className="h-4 w-4 text-primary mb-2" />
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`font-display text-xl font-bold ${highlight ?? ""}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-display">P&L Waterfall</CardTitle>
            <CardDescription>Revenue → charges → net profit</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfitChart data={waterfall} />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Orders by State
            </CardTitle>
            <CardDescription>From Excel/CSV State or Pincode column</CardDescription>
          </CardHeader>
          <CardContent>
            {data.ordersByState.length > 0 ? (
              <IndiaOrdersMap data={data.ordersByState} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Add State or Pincode column in your CSV to see state-wise map.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Charge breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["Gross Revenue (GST Sale)", s.grossRevenue, false],
              ...(s.gstReturnTotal != null
                ? [["GST Returns", -s.gstReturnTotal, true] as const]
                : []),
              ...(s.netTaxableSales != null
                ? [["Net Taxable Sales", s.netTaxableSales, false] as const]
                : []),
              ["Marketplace Commission", -s.marketplaceCharges, true],
              ["Shipping", -s.shippingCharges, true],
              ["Returns", -s.returnCharges, true],
              ["RTO Loss", -s.rtoLoss, true],
              ["GST", -s.gstImpact, true],
              ["Net Profit", s.netProfit, false],
            ].map(([label, val, isCharge]) => (
              <div key={String(label)} className="flex justify-between border-b border-border/50 py-2">
                <span>{label}</span>
                <span
                  className={
                    isCharge ? "text-red-500" : Number(val) >= 0 ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"
                  }
                >
                  {formatINR(Math.abs(Number(val)))}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Top SKUs by profit</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-2">Product</th>
                  <th className="pb-2 pr-2">Sales</th>
                  <th className="pb-2">Profit</th>
                </tr>
              </thead>
              <tbody>
                {data.skuData.slice(0, 8).map((row) => (
                  <tr key={row.sku} className="border-b border-border/40">
                    <td className="py-2 pr-2 max-w-[140px] truncate">{row.name}</td>
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

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Sample orders</CardTitle>
          <CardDescription>First 20 rows from your settlement CSV</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-3">Order</th>
                <th className="pb-2 pr-3">Product</th>
                <th className="pb-2 pr-3">State</th>
                <th className="pb-2 pr-3">Sale</th>
                <th className="pb-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {data.sampleOrders.slice(0, 20).map((o, i) => (
                <tr key={o.orderId ?? i} className="border-b border-border/40">
                  <td className="py-2 pr-3 font-mono text-xs">{o.orderId ?? "—"}</td>
                  <td className="py-2 pr-3 max-w-[160px] truncate">{o.productName}</td>
                  <td className="py-2 pr-3">{o.state ?? "—"}</td>
                  <td className="py-2 pr-3">{formatINR(o.saleAmount)}</td>
                  <td className={`py-2 ${o.netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {formatINR(o.netProfit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {data.isDemo && data.insights ? (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Insights (demo)
            </CardTitle>
            <CardDescription>What you get after uploading your report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <p>{data.insights.summary}</p>
              <ul className="space-y-2">
                {data.insights.products.slice(0, 4).map((p) => (
                  <li key={p.sku} className="rounded-lg border border-border p-3">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground"> — {p.metric}</span>
                    <p className="text-muted-foreground mt-1">{p.recommendation}</p>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : !data.isDemo && data.insights ? (
        <InsightsPanel
          reportId={data.id}
          reportName={data.name}
          insights={data.insights}
          credits={credits}
        />
      ) : null}

      {data.isDemo && (
        <div className="text-center py-8 rounded-2xl border border-dashed border-primary/40">
          <p className="font-display text-xl font-bold">Ready for your real data?</p>
          <p className="text-muted-foreground mt-2 mb-6">
            Register → upload CSV → get this full report in under 2 minutes
          </p>
          <Button size="lg" asChild>
            <Link href="/register">Start free with 10 credits</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
