import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getReportAnalytics, getUserCompletedReports } from "@/lib/report-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportPicker } from "@/components/dashboard/report-picker";
import { IndiaOrdersMap } from "@/components/dashboard/india-orders-map";
import { formatINR } from "@/lib/utils";
import { MapPin, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function StatesPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string }>;
}) {
  const session = await requireSession();
  const { report: reportId } = await searchParams;

  const [analytics, reports] = await Promise.all([
    getReportAnalytics(session.user.id, reportId),
    getUserCompletedReports(session.user.id),
  ]);

  if (!analytics) {
    return (
      <div className="space-y-6 text-center py-12">
        <MapPin className="mx-auto h-12 w-12 text-primary/50" />
        <h1 className="font-display text-2xl font-bold">State-wise Orders</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Upload CSV with <strong>State</strong> or <strong>Pincode</strong> column — map par hover
          kari ne order count dekho.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/dashboard/reports">Upload report</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/demo-report">View demo map</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { report, ordersByState } = analytics;
  const topState = ordersByState[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-7 w-7 text-primary" />
            State-wise Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            Excel/CSV mathi state data — map hover par orders & revenue
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/reports/${report._id.toString()}`}>Full report →</Link>
        </Button>
      </div>

      <ReportPicker
        reports={reports.map((r) => ({ id: r._id.toString(), name: r.name }))}
        selectedId={report._id.toString()}
        basePath="/dashboard/states"
      />

      {ordersByState.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Aa report ma State/Pincode column nathi.</p>
            <p className="text-sm mt-2">
              Meesho CSV ma <code className="text-primary">State</code> ke{" "}
              <code className="text-primary">Pincode</code> column add karo.
            </p>
            <Button className="mt-4" variant="outline" asChild>
              <a href="/sample-meesho.csv" download>
                <Download className="h-4 w-4 mr-1" />
                Sample CSV download
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">States covered</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-bold text-primary">{ordersByState.length}</p>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Top state</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-xl font-bold">{topState?.state}</p>
                <p className="text-sm text-muted-foreground">{topState?.orderCount} orders</p>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Top state revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-2xl font-bold">{formatINR(topState?.revenue ?? 0)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-display">India order map</CardTitle>
              <CardDescription>
                Report: {report.name} — hover on state to see order count
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IndiaOrdersMap data={ordersByState} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
