import { requireSession } from "@/lib/session";

import { getReportAnalytics, getUserCompletedReports } from "@/lib/report-data";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { formatINR, formatPct } from "@/lib/utils";

import { ReportPicker } from "@/components/dashboard/report-picker";

import Link from "next/link";



export default async function SkuPage({

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

        <p>No data — upload a report first.</p>

        <Link href="/demo-report" className="text-primary hover:underline mt-2 inline-block">

          View demo report

        </Link>

      </div>

    );

  }



  const { report, skuData } = analytics;



  return (

    <div className="space-y-6">

      <div>

        <h1 className="font-display text-2xl font-bold">SKU Analytics</h1>

        <p className="text-muted-foreground">{report.name}</p>

      </div>



      <ReportPicker

        reports={reports.map((r) => ({ id: r._id.toString(), name: r.name }))}

        selectedId={report._id.toString()}

        basePath="/dashboard/sku"

      />



      <Card>

        <CardHeader>

          <CardTitle>All SKUs</CardTitle>

        </CardHeader>

        <CardContent className="overflow-x-auto">

          {skuData.length === 0 ? (

            <p className="text-muted-foreground">No SKU data in this report.</p>

          ) : (

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b border-border text-left text-muted-foreground">

                  <th className="pb-2 pr-4">Product / SKU</th>

                  <th className="pb-2 pr-4">Orders</th>

                  <th className="pb-2 pr-4">Sales</th>

                  <th className="pb-2 pr-4">Profit</th>

                  <th className="pb-2">Return %</th>

                </tr>

              </thead>

              <tbody>

                {skuData.map((row) => (

                  <tr key={row.sku} className="border-b border-border/50">

                    <td className="py-3 pr-4 max-w-xs truncate">{row.name}</td>

                    <td className="py-3 pr-4">{row.count}</td>

                    <td className="py-3 pr-4">{formatINR(row.sales)}</td>

                    <td className={`py-3 pr-4 ${row.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>

                      {formatINR(row.profit)}

                    </td>

                    <td className="py-3">{formatPct(row.returnRate)}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </CardContent>

      </Card>

    </div>

  );

}

