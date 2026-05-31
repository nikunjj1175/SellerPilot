import Link from "next/link";
import { requireSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { Report } from "@/models";
import type { IReport } from "@/models/Report";
import { loadProductCostPage } from "@/app/actions/product-costs";
import { ProductCostsForm } from "@/components/dashboard/product-costs-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Suspense } from "react";

async function ProductCostsContent({
  reportId,
  search,
  page,
}: {
  reportId: string;
  search?: string;
  page: number;
}) {
  const data = await loadProductCostPage(reportId, search, page);
  if (!data.report) return null;

  return (
    <ProductCostsForm
      reportId={reportId}
      reportName={data.report.name}
      reportPeriod={data.report.createdAt}
      initialRows={data.rows}
      total={data.total}
      uniqueSkus={data.uniqueSkus}
      page={data.page}
      pageSize={data.pageSize}
    />
  );
}

export default async function ProductCostsPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string; q?: string; page?: string }>;
}) {
  const session = await requireSession();
  const { report: reportId, q, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  await connectDB();
  const completed = await Report.find({ userId: session.user.id, status: "COMPLETED" })
    .sort({ createdAt: -1 })
    .select("name createdAt")
    .lean<Pick<IReport, "_id" | "name" | "createdAt">[]>();

  if (!completed.length) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold">Product Costs</h1>
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Upload a Meesho report first, then add product & packaging costs per SKU.</p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/reports">Go to Reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeId = reportId ?? completed[0]._id.toString();

  return (
    <div className="space-y-4">
      {completed.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Report:</span>
          {completed.map((r) => (
            <Link
              key={r._id.toString()}
              href={`/dashboard/product-costs?report=${r._id.toString()}`}
              className={`text-xs rounded-full px-3 py-1 border ${
                r._id.toString() === activeId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted"
              }`}
            >
              {r.name}
            </Link>
          ))}
        </div>
      )}

      <Suspense fallback={<p className="text-muted-foreground">Loading costs…</p>}>
        <ProductCostsContent reportId={activeId} search={q} page={page} />
      </Suspense>
    </div>
  );
}
