import { requireSession } from "@/lib/session";

import { getReportAnalytics, getUserCompletedReports } from "@/lib/report-data";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { formatINR, formatPct } from "@/lib/utils";

import { ReportPicker } from "@/components/dashboard/report-picker";

import { IndiaOrdersMap } from "@/components/dashboard/india-orders-map";

import Link from "next/link";



export default async function ReturnsPage({

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

      <div className="text-center py-12 text-muted-foreground">

        <p>Upload a report first.</p>

        <Link href="/demo-report" className="text-primary hover:underline mt-2 inline-block">

          View demo

        </Link>

      </div>

    );

  }



  const { report, summary, ordersByState } = analytics;



  return (

    <div className="space-y-6">

      <div>

        <h1 className="font-display text-2xl font-bold">Returns</h1>

        <p className="text-muted-foreground">{report.name}</p>

      </div>



      <ReportPicker

        reports={reports.map((r) => ({ id: r._id.toString(), name: r.name }))}

        selectedId={report._id.toString()}

        basePath="/dashboard/returns"

      />



      <div className="grid gap-4 sm:grid-cols-3">

        <Card>

          <CardHeader className="pb-2">

            <CardTitle className="text-sm text-muted-foreground">Return orders</CardTitle>

          </CardHeader>

          <CardContent>

            <p className="text-3xl font-bold">{summary.returnCount}</p>

          </CardContent>

        </Card>

        <Card>

          <CardHeader className="pb-2">

            <CardTitle className="text-sm text-muted-foreground">Return rate</CardTitle>

          </CardHeader>

          <CardContent>

            <p className="text-3xl font-bold">{formatPct(summary.returnRate)}</p>

          </CardContent>

        </Card>

        <Card>

          <CardHeader className="pb-2">

            <CardTitle className="text-sm text-muted-foreground">Return charges</CardTitle>

          </CardHeader>

          <CardContent>

            <p className="text-3xl font-bold text-red-500">{formatINR(summary.returnCharges)}</p>

          </CardContent>

        </Card>

      </div>



      {ordersByState.length > 0 && (

        <Card>

          <CardHeader>

            <CardTitle>Returns by state (hover map)</CardTitle>

          </CardHeader>

          <CardContent>

            <IndiaOrdersMap data={ordersByState} />

          </CardContent>

        </Card>

      )}

    </div>

  );

}

