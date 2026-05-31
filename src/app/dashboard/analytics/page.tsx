import { requireSession } from "@/lib/session";

import { getReportAnalytics, getUserCompletedReports } from "@/lib/report-data";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { formatINR } from "@/lib/utils";

import { ProfitChart } from "@/components/dashboard/profit-chart";

import { ReportPicker } from "@/components/dashboard/report-picker";

import { IndiaOrdersMap } from "@/components/dashboard/india-orders-map";

import Link from "next/link";



export default async function AnalyticsPage({

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

      <div className="text-center py-12 text-muted-foreground space-y-4">

        <p>No completed reports. Upload a CSV first.</p>

        <Link href="/demo-report" className="text-primary hover:underline block">

          Or view demo report →

        </Link>

      </div>

    );

  }



  const { report, summary: s, ordersByState } = analytics;



  const breakdown = [

    { name: "Gross Revenue", value: s.grossRevenue, fill: "#10b981" },

    { name: "Commission", value: -s.marketplaceCharges, fill: "#ef4444" },

    { name: "Shipping", value: -s.shippingCharges, fill: "#f97316" },

    { name: "Returns", value: -s.returnCharges, fill: "#eab308" },

    { name: "RTO", value: -s.rtoLoss, fill: "#ec4899" },

    { name: "GST", value: -s.gstImpact, fill: "#6366f1" },

  ];



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

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>

          <h1 className="font-display text-2xl font-bold">P&L Analytics</h1>

          <p className="text-muted-foreground">{report.name}</p>

        </div>

        <Link

          href={`/dashboard/reports/${report._id.toString()}`}

          className="text-sm text-primary hover:underline"

        >

          Full report view →

        </Link>

      </div>



      <ReportPicker

        reports={reports.map((r) => ({ id: r._id.toString(), name: r.name }))}

        selectedId={report._id.toString()}

        basePath="/dashboard/analytics"

      />



      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {[

          ["Gross Revenue", s.grossRevenue],

          ["Marketplace Charges", s.marketplaceCharges],

          ["Shipping", s.shippingCharges],

          ["Return Charges", s.returnCharges],

          ["RTO Loss", s.rtoLoss],

          ["Net Profit", s.netProfit],

        ].map(([label, value]) => (

          <Card key={String(label)}>

            <CardHeader className="pb-2">

              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>

            </CardHeader>

            <CardContent>

              <p

                className={`text-2xl font-bold ${label === "Net Profit" && Number(value) < 0 ? "text-red-500" : ""}`}

              >

                {formatINR(Number(value))}

              </p>

            </CardContent>

          </Card>

        ))}

      </div>



      <div className="grid gap-6 lg:grid-cols-2">

        <Card>

          <CardHeader>

            <CardTitle>Profit Breakdown</CardTitle>

          </CardHeader>

          <CardContent>

            <ProfitChart data={waterfall} />

          </CardContent>

        </Card>



        <Card>

          <CardHeader>

            <CardTitle>Orders by State</CardTitle>

          </CardHeader>

          <CardContent>

            {ordersByState.length > 0 ? (

              <IndiaOrdersMap data={ordersByState} />

            ) : (

              <p className="text-sm text-muted-foreground">Add State/Pincode column in CSV.</p>

            )}

          </CardContent>

        </Card>

      </div>



      <Card>

        <CardHeader>

          <CardTitle>Charge Components</CardTitle>

        </CardHeader>

        <CardContent className="space-y-2">

          {breakdown.map((item) => (

            <div key={item.name} className="flex justify-between text-sm">

              <span>{item.name}</span>

              <span className={item.value < 0 ? "text-red-500" : "text-emerald-600"}>

                {formatINR(Math.abs(item.value))}

              </span>

            </div>

          ))}

        </CardContent>

      </Card>

    </div>

  );

}

