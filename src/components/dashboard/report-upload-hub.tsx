"use client";

import { useState } from "react";
import { ManualUploadWizard } from "@/components/dashboard/manual-upload-wizard";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Zap, Sparkles, Upload } from "lucide-react";
import Link from "next/link";

type Props = {
  defaultMonth?: string;
  showManualInitially?: boolean;
  /** When true, wizard stays on its own route (no collapse to same-page feel) */
  dedicatedPage?: boolean;
};

export function ReportUploadHub({
  defaultMonth,
  showManualInitially = false,
  dedicatedPage = false,
}: Props) {
  const [manualOpen, setManualOpen] = useState(showManualInitially || dedicatedPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl md:text-3xl font-bold text-foreground">
          Upload New Report
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate your Meesho monthly P&L from supplier panel exports.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-emerald-200/70 bg-white p-5 md:p-6 shadow-sm relative">
          <span className="absolute top-4 right-4 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
            Recommended
          </span>
          <div className="flex items-center gap-2 mb-2 pr-24">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold text-xl font-bold">Generate Automatically</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl mb-4">
            Automatically fetch report data from your Meesho account — encrypted storage and live
            progress. Launching soon.
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { icon: Lock, text: "Encrypted credential storage" },
              { icon: Shield, text: "Private background processing" },
              { icon: Zap, text: "Live progress tracking" },
            ].map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {text}
              </span>
            ))}
          </div>
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <p className="text-sm font-medium text-slate-700">Saved Meesho account</p>
            <p className="text-xs text-muted-foreground">Not connected yet</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled className="rounded-xl opacity-60">
                Generate Report
              </Button>
              <Button type="button" variant="outline" disabled className="rounded-xl">
                Change credentials
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg font-bold">Upload Files Manually</h2>
          </div>
          <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
            Use when you have <strong>Orders CSV</strong>, <strong>tcs_sales.xlsx</strong>, and optional
            return file ready.
          </p>
          <div className="flex flex-wrap gap-1.5 my-4">
            {["Desktop", "2–3 files", "3 steps"].map((t) => (
              <span
                key={t}
                className="text-[10px] font-medium rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600"
              >
                {t}
              </span>
            ))}
          </div>
          {!dedicatedPage && (
            <Button
              type="button"
              variant={manualOpen ? "default" : "outline"}
              className="rounded-xl w-full mt-auto"
              onClick={() => setManualOpen((v) => !v)}
            >
              {manualOpen ? "Hide Manual Upload" : "Use Manual Upload"}
            </Button>
          )}
          {dedicatedPage && !manualOpen && (
            <Button
              type="button"
              className="rounded-xl w-full mt-auto"
              onClick={() => setManualOpen(true)}
            >
              Start Manual Upload
            </Button>
          )}
        </div>
      </div>

      {manualOpen && (
        <ManualUploadWizard
          defaultMonth={defaultMonth}
          onHide={dedicatedPage ? undefined : () => setManualOpen(false)}
        />
      )}

      <p className="text-xs text-muted-foreground text-center pb-4">
        <Link href="/demo-report" className="text-primary font-medium hover:underline">
          View sample report
        </Link>
      </p>
    </div>
  );
}
