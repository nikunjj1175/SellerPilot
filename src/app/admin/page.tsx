import { getAdminStats } from "@/lib/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";
import { Users, FileSpreadsheet, CreditCard, UserPlus } from "lucide-react";

export default async function AdminPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.users}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">New (7d)</CardTitle>
            <UserPlus className="h-4 w-4" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.recentUsers}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Reports</CardTitle>
            <FileSpreadsheet className="h-4 w-4" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.reports}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Revenue</CardTitle>
            <CreditCard className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatINR(stats.revenuePaise / 100)}</p>
            <p className="text-xs text-muted-foreground">{stats.payments} payments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm">
          {Object.entries(stats.reportStats).map(([status, count]) => (
            <span key={status} className="rounded-lg border border-border px-3 py-2">
              {status}: <strong>{count}</strong>
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
