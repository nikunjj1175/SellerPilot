import Link from "next/link";
import { requireSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { Report, type IReport } from "@/models/Report";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { ReportUploadForm } from "@/components/dashboard/report-upload-form";
import { ReportsList, ReportsPageHeader } from "@/components/dashboard/reports-list";
import { serializeReport } from "@/lib/serialize";

export default async function ReportsPage() {
  const session = await requireSession();
  await connectDB();

  const reports = await Report.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean<IReport[]>();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ReportsPageHeader />

      <ReportsList reports={reports.map((r) => serializeReport(r))} />

      <Card id="upload" className="rounded-2xl border border-border bg-card shadow-sm scroll-mt-8">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg">Generate New P&L Report</CardTitle>
          <CardDescription className="text-sm">
            Upload 3 Meesho files: Orders CSV + tcs_sales.xlsx + tcs_sales_return.xlsx (2 credits)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <ReportUploadForm />
          </Suspense>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            Report ready પછી{" "}
            <Link href="/dashboard/product-costs" className="text-primary font-medium hover:underline">
              Product Costs
            </Link>{" "}
            માં SKU price ભરો → proper net profit દેખાશે.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
