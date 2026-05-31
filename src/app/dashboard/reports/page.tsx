import Link from "next/link";
import { requireSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { Report, type IReport } from "@/models/Report";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { ReportUploadForm } from "@/components/dashboard/report-upload-form";
import { ReportsList, ReportsPageHeader } from "@/components/dashboard/reports-list";
import { serializeReport } from "@/lib/serialize";
import { getAgencyStoresForUser } from "@/lib/agency";

export default async function ReportsPage() {
  const session = await requireSession();
  await connectDB();

  const [reports, agencyStores] = await Promise.all([
    Report.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean<IReport[]>(),
    getAgencyStoresForUser(session.user.id),
  ]);

  return (
    <div className="space-y-8">
      <ReportsPageHeader />

      <ReportsList reports={reports.map((r) => serializeReport(r))} />

      <Card id="upload" className="rounded-2xl border-primary/20 shadow-sm scroll-mt-8">
        <CardHeader>
          <CardTitle className="font-display">Generate New P&L Report</CardTitle>
          <CardDescription>
            Upload Meesho Orders CSV + tcs_sales + tcs_sales_return · Monthly: 2 credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <ReportUploadForm stores={agencyStores} />
          </Suspense>
          <p className="text-xs text-muted-foreground mt-4">
            Report ready પછી{" "}
            <Link href="/dashboard/product-costs" className="text-primary hover:underline">
              Product Costs
            </Link>{" "}
            માં SKU cost ભરો — ત્યારે proper net profit દેખાશે.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
