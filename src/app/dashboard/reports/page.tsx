import Link from "next/link";
import { requireSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { connectDB } from "@/lib/mongodb";
import { Report, type IReport } from "@/models/Report";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { ReportUploadForm } from "@/components/dashboard/report-upload-form";
import { ReportsList } from "@/components/dashboard/reports-list";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Upload Meesho Orders + GST Sale + GST Return Excel for accurate P&L</p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="font-display">New here?</CardTitle>
          <CardDescription>
            View full demo report (P&L, state map, SKU, AI) before spending credits
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/demo-report">View demo report</Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="/sample-meesho.csv" download>
              Download sample CSV
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
          <CardDescription>
            Monthly: 2 credits · Quarterly: 5 · Yearly: 10 credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <ReportUploadForm stores={agencyStores} />
          </Suspense>
        </CardContent>
      </Card>

      <ReportsList reports={reports.map((r) => serializeReport(r))} />
    </div>
  );
}
