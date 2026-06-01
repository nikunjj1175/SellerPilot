"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { uploadAndProcessReport } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  addCalendarMonth,
  currentYearMonth,
  defaultReportName,
  formatReportMonth,
} from "@/lib/report-month";
import { Play, FileArchive, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

const FILE_ACCEPT = ".xlsx,.xls,.csv,.txt,.zip";

type Props = {
  defaultMonth?: string;
  onHide?: () => void;
};

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-sm font-bold border border-rose-200">
      {n}
    </span>
  );
}

function MonthPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary whitespace-nowrap">
      {label}
    </span>
  );
}

export function ManualUploadWizard({ defaultMonth, onHide }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [reportMonth, setReportMonth] = useState(defaultMonth ?? currentYearMonth());
  const [ordersFile, setOrdersFile] = useState<File | null>(null);
  const [gstSaleFile, setGstSaleFile] = useState<File | null>(null);
  const [gstReturnFile, setGstReturnFile] = useState<File | null>(null);
  const [miscCosts, setMiscCosts] = useState("0");
  const [notes, setNotes] = useState("");

  const monthLabel = formatReportMonth(reportMonth);
  const nextMonth = addCalendarMonth(reportMonth, 1);
  const nextMonthLabel = formatReportMonth(nextMonth);

  const requiredCount = (ordersFile ? 1 : 0) + (gstSaleFile ? 1 : 0);
  const totalSelected = requiredCount + (gstReturnFile ? 1 : 0);
  const canProcess = ordersFile && gstSaleFile && !pending;

  const fileSummary = useMemo(
    () => [
      { label: "Orders CSV", month: monthLabel },
      { label: "GST Sale (tcs_sales.xlsx)", month: monthLabel },
      { label: "GST Return (tcs_sales_return.xlsx)", month: `${monthLabel} (optional)` },
    ],
    [monthLabel]
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ordersFile || !gstSaleFile) {
      toast.error("Upload Orders CSV and tcs_sales.xlsx first.");
      return;
    }

    const fd = new FormData();
    fd.set("name", defaultReportName(reportMonth));
    fd.set("type", "MONTHLY");
    fd.set("reportMonth", reportMonth);
    if (miscCosts) fd.set("miscCosts", miscCosts);
    if (notes) fd.set("notes", notes);
    fd.set("ordersFile", ordersFile);
    fd.set("gstSaleFile", gstSaleFile);
    if (gstReturnFile) fd.set("gstReturnFile", gstReturnFile);

    startTransition(async () => {
      const result = await uploadAndProcessReport(fd);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        "message" in result && result.message
          ? String(result.message)
          : "Meesho P&L report is processing!"
      );
      formRef.current?.reset();
      setOrdersFile(null);
      setGstSaleFile(null);
      setGstReturnFile(null);
      router.push("/dashboard/reports");
      router.refresh();
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="rounded-2xl border-2 border-primary/20 bg-card shadow-sm overflow-hidden"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 bg-muted/30 px-5 py-4">
        <div>
          <h2 className="font-display text-xl font-bold">Manual Upload</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Use this when you have Meesho Orders CSV and GST sale files ready from supplier.meesho.com
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg border-red-200 text-red-700 hover:bg-red-50"
            asChild
          >
            <a href="https://supplier.meesho.com" target="_blank" rel="noreferrer">
              <Play className="h-3.5 w-3.5 mr-1 fill-current" />
              How to export
            </a>
          </Button>
          {onHide && (
            <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={onHide}>
              Hide Manual Upload
            </Button>
          )}
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-8">
        {/* Step 1 */}
        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <StepBadge n={1} />
            <div className="flex-1 space-y-1">
              <h3 className="font-display text-lg font-bold">Choose Report Month</h3>
              <p className="text-sm text-muted-foreground">
                Select the month you want P&L for. File names should match this period.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
              <Label htmlFor="reportMonth">Report month</Label>
              <Input
                id="reportMonth"
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="rounded-xl max-w-xs"
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Report title: <strong>{defaultReportName(reportMonth)}</strong>
              </p>
              <div className="rounded-lg border border-border/60 bg-card p-3 space-y-2 text-sm">
                <p className="font-medium text-xs uppercase text-muted-foreground">Files expected</p>
                {fileSummary.map((f) => (
                  <div key={f.label} className="flex justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-medium text-right">{f.month}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                1
              </span>
              <p className="text-sm text-muted-foreground">
                Start here — confirm month, then upload Orders CSV and GST files below.
              </p>
            </div>
          </div>
        </section>

        {/* Step 2 */}
        <section className="space-y-4 border-t border-border/50 pt-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <StepBadge n={2} />
              <div>
                <h3 className="font-display text-lg font-bold">Upload Orders CSV</h3>
                <p className="text-sm text-muted-foreground">
                  Use the Orders export for the selected report month only.
                </p>
              </div>
            </div>
            <MonthPill label={`Selected month: ${monthLabel}`} />
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Orders CSV — {monthLabel}
            </Label>
            <Input
              type="file"
              accept={FILE_ACCEPT}
              className="rounded-xl"
              onChange={(e) => setOrdersFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Expected: <strong>Orders_*.csv</strong> from Meesho supplier panel for {monthLabel}.
            </p>
          </div>
        </section>

        {/* Step 3 */}
        <section className="space-y-4 border-t border-border/50 pt-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <StepBadge n={3} />
              <div>
                <h3 className="font-display text-lg font-bold">Upload GST / Payment Files</h3>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  Download <strong>tcs_sales.xlsx</strong> and optional{" "}
                  <strong>tcs_sales_return.xlsx</strong> from Meesho payments / GST section.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg border-red-200 text-red-700 hover:bg-red-50"
              asChild
            >
              <a href="https://supplier.meesho.com" target="_blank" rel="noreferrer">
                <Play className="h-3.5 w-3.5 mr-1 fill-current" />
                View export steps
              </a>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <FileArchive className="h-4 w-4" />
                  {monthLabel} — tcs_sales.xlsx
                </Label>
                <MonthPill label={`Month: ${monthLabel}`} />
              </div>
              <Input
                type="file"
                accept={FILE_ACCEPT}
                className="rounded-xl"
                onChange={(e) => setGstSaleFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                GST sale file for settlements in {monthLabel}.
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <FileArchive className="h-4 w-4" />
                  {nextMonthLabel} — tcs_sales_return.xlsx
                </Label>
                <MonthPill label={`Optional`} />
              </div>
              <Input
                type="file"
                accept={FILE_ACCEPT}
                className="rounded-xl"
                onChange={(e) => setGstReturnFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                <strong>Recommended:</strong> return file for accurate RTO & return matching.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="miscCosts">Miscellaneous Monthly Costs (₹)</Label>
              <Input
                id="miscCosts"
                type="number"
                min="0"
                step="0.01"
                value={miscCosts}
                onChange={(e) => setMiscCosts(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Fixed monthly expenses (rent, salary, etc.) — saved with report notes for your reference.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for this report"
                className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-[88px]"
              />
            </div>
          </div>

          <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-xs text-amber-950 leading-relaxed">
            <strong>Where to export:</strong> supplier.meesho.com → Orders (CSV) + Payments / GST downloads
            → <strong>tcs_sales.xlsx</strong> and <strong>tcs_sales_return.xlsx</strong>.
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 bg-muted/30 px-5 py-4">
        <p className="text-sm text-muted-foreground">
          <span className={cn("font-semibold", canProcess ? "text-emerald-700" : "")}>
            {totalSelected} of 3
          </span>{" "}
          files selected ({requiredCount}/2 required)
        </p>
        <Button
          type="submit"
          disabled={!canProcess}
          className="rounded-xl px-8 h-11 text-base shadow-md"
        >
          {pending ? "Processing…" : "Process Files"}
        </Button>
      </div>
    </form>
  );
}
