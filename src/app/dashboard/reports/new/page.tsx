import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/session";
import { ReportUploadHub } from "@/components/dashboard/report-upload-hub";
import { Button } from "@/components/ui/button";

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; manual?: string }>;
}) {
  await requireSession();
  const { month, manual } = await searchParams;
  const openManual = manual !== "0";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="rounded-lg -ml-2" asChild>
          <Link href="/dashboard/reports">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to My Reports
          </Link>
        </Button>
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <ReportUploadHub
          defaultMonth={month}
          showManualInitially={openManual}
          dedicatedPage
        />
      </Suspense>
    </div>
  );
}
