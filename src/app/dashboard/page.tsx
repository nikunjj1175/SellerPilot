import { requireSession } from "@/lib/session";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/dashboard-data";
import { getDemoReportData } from "@/lib/demo-report";
import { IndiaOrdersMap } from "@/components/dashboard/india-orders-map";
import { formatINR, formatPct } from "@/lib/utils";
import { IndianRupee, Package, RotateCcw, TrendingUp, Truck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await requireSession();
  const stats = await getDashboardStats(session.user.id);
  const s = stats.summary;
  const demoData = stats.reportCount === 0 ? getDemoReportData() : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {stats.reportCount} completed report{stats.reportCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/reports">Upload Report</Link>
        </Button>
        {stats.reportCount === 0 && (
          <Button variant="outline" asChild>
            <Link href="/demo-report">Demo report</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenue"
          value={formatINR(s?.grossRevenue ?? stats.totals.revenue)}
          subtitle="Latest report"
          icon={IndianRupee}
          trend="up"
        />
        <StatCard
          title="Net Profit"
          value={formatINR(s?.netProfit ?? stats.totals.profit)}
          subtitle="After all charges"
          icon={TrendingUp}
          trend={(s?.netProfit ?? 0) >= 0 ? "up" : "down"}
        />
        <StatCard
          title="Orders"
          value={String(s?.totalOrders ?? stats.totals.orders)}
          icon={Package}
        />
        <StatCard
          title="Return Rate"
          value={formatPct(s?.returnRate ?? 0)}
          subtitle={`${s?.returnCount ?? stats.totals.returns} returns`}
          icon={RotateCcw}
          trend="down"
        />
        <StatCard
          title="RTO Rate"
          value={formatPct(s?.rtoRate ?? 0)}
          subtitle={`${s?.rtoCount ?? stats.totals.rto} RTO`}
          icon={Truck}
          trend="down"
        />
      </div>

      {demoData && demoData.ordersByState.length > 0 && (
        <Card className="border-primary/30 glass">
          <CardHeader>
            <CardTitle className="font-display">Demo: State-wise orders map</CardTitle>
            <CardDescription>
              Aap upload karo tyare aavi map aavshe —{" "}
              <Link href="/demo-report" className="text-primary hover:underline">
                full demo report joi lo
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IndiaOrdersMap data={demoData.ordersByState.slice(0, 8)} showTable={false} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Profit Trend</CardTitle>
            <CardDescription>Across your uploaded reports</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={stats.trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top SKUs by Profit</CardTitle>
            <CardDescription>From latest report</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.skuData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Upload a CSV to see SKU breakdown</p>
            ) : (
              <div className="space-y-3">
                {stats.skuData.slice(0, 5).map((sku) => (
                  <div key={sku.sku} className="flex items-center justify-between text-sm">
                    <div className="min-w-0 flex-1 truncate pr-4">
                      <p className="font-medium truncate">{sku.name}</p>
                      <p className="text-xs text-muted-foreground">Return {formatPct(sku.returnRate)}</p>
                    </div>
                    <span className={sku.profit >= 0 ? "text-emerald-600" : "text-red-500"}>
                      {formatINR(sku.profit)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
