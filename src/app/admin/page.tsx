import { getAdminStats } from "@/lib/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminOverviewCharts } from "@/components/admin/admin-overview-charts";
import { formatINR } from "@/lib/utils";
import { Users, FileSpreadsheet, CreditCard, UserPlus, Coins } from "lucide-react";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Users;
}) {
  return (
    <Card className="rounded-2xl border-border/80 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground font-medium">{label}</CardTitle>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl md:text-3xl font-semibold text-primary tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default async function AdminPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Overview"
        description="Platform health — users, reports, revenue and credits."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 animate-fade-up">
        <StatCard label="Total users" value={String(stats.users)} icon={Users} />
        <StatCard label="New (7 days)" value={String(stats.recentUsers)} icon={UserPlus} />
        <StatCard label="Reports" value={String(stats.reports)} icon={FileSpreadsheet} />
        <StatCard
          label="Revenue"
          value={formatINR(stats.revenuePaise / 100)}
          sub={`${stats.payments} paid orders`}
          icon={CreditCard}
        />
        <StatCard
          label="Credits sold"
          value={String(stats.creditsSold)}
          icon={Coins}
        />
      </div>

      <AdminOverviewCharts
        revenueSeries={stats.revenueSeries}
        signupSeries={stats.signupSeries}
        reportStatusChart={stats.reportStatusChart}
      />

      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Report pipeline</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {Object.entries(stats.reportStats).map(([status, count]) => (
            <span
              key={status}
              className="rounded-xl border border-border bg-muted/40 px-4 py-2 text-sm"
            >
              <span className="text-muted-foreground">{status}:</span>{" "}
              <strong className="text-foreground">{count}</strong>
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
