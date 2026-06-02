"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  saveProductCosts,
  exportProductCostsCsv,
  importProductCostsCsv,
} from "@/app/actions/product-costs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { SkuCostRow } from "@/lib/product-costs";
import { Download, Upload, Save, ArrowLeft } from "lucide-react";

type Props = {
  reportId: string;
  reportName: string;
  reportPeriod: string;
  initialRows: SkuCostRow[];
  total: number;
  uniqueSkus: number;
  page: number;
  pageSize: number;
};

function formatCostInput(n: number) {
  if (!n || n <= 0) return "";
  return Number(n).toFixed(2);
}

export function ProductCostsForm({
  reportId,
  reportName,
  reportPeriod,
  initialRows,
  total,
  uniqueSkus,
  page,
  pageSize,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState(initialRows);
  const [commonPack, setCommonPack] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const searchQ = searchParams.get("q") ?? "";

  const d = new Date(reportPeriod);
  const periodLabel = !Number.isNaN(d.getTime())
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    : reportPeriod.slice(0, 7);

  function updateRow(index: number, field: "productCost" | "packCost", value: string) {
    const n = value === "" ? 0 : parseFloat(value);
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: Number.isFinite(n) ? Math.max(0, n) : 0 };
      return next;
    });
  }

  function goPage(next: number) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("report", reportId);
    p.set("page", String(next));
    router.push(`/dashboard/product-costs?${p.toString()}`);
  }

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = String(fd.get("q") ?? "").trim();
    const p = new URLSearchParams();
    p.set("report", reportId);
    if (q) p.set("q", q);
    router.push(`/dashboard/product-costs?${p.toString()}`);
  }

  function getPackValue() {
    const v = parseFloat(commonPack);
    if (!Number.isFinite(v) || v < 0) return null;
    return v;
  }

  function handleSave(extra?: { fillMissingPack?: boolean; applyPackToAll?: boolean }) {
    const packVal = getPackValue();
    if ((extra?.fillMissingPack || extra?.applyPackToAll) && packVal == null) {
      toast.error("Enter common packaging cost first (e.g. 10)");
      return;
    }

    let rowsToSave = rows;
    if (extra?.applyPackToAll && packVal != null) {
      rowsToSave = rows.map((r) => ({ ...r, packCost: packVal }));
      setRows(rowsToSave);
    } else if (extra?.fillMissingPack && packVal != null) {
      rowsToSave = rows.map((r) => (r.packCost <= 0 ? { ...r, packCost: packVal } : r));
      setRows(rowsToSave);
    }

    startTransition(async () => {
      const res = await saveProductCosts(reportId, rowsToSave, {
        commonPackCost: packVal ?? 0,
        fillMissingPack: extra?.fillMissingPack,
        applyPackToAll: extra?.applyPackToAll,
      });
      if ("error" in res && res.error) {
        toast.error(String(res.error));
        return;
      }
      toast.success("Product costs saved — net profit updated");
      router.refresh();
    });
  }

  function handleExport() {
    startTransition(async () => {
      const res = await exportProductCostsCsv(reportId);
      if ("error" in res && res.error) {
        toast.error(String(res.error));
        return;
      }
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.fileName;
      a.click();
      URL.revokeObjectURL(url);
      const n = "rowCount" in res ? res.rowCount : 0;
      toast.success(`Exported ${n} SKU rows — edit costs and re-import`);
    });
  }

  function handleImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      startTransition(async () => {
        const res = await importProductCostsCsv(reportId, String(reader.result ?? ""));
        if ("error" in res && res.error) {
          toast.error(String(res.error));
          return;
        }
        const count = "imported" in res ? res.imported : 0;
        const dup = "duplicateRowsMerged" in res ? res.duplicateRowsMerged : 0;
        const byId = "matchedById" in res ? res.matchedById : 0;
        const unmatched = "unmatched" in res ? res.unmatched : 0;
        toast.success(
          `Updated ${count} rows (${byId} by ID)${dup ? ` · ${dup} duplicates merged` : ""}${unmatched ? ` · ${unmatched} unmatched` : ""}`
        );
        router.refresh();
      });
    };
    reader.onerror = () => toast.error("Could not read file");
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-primary font-semibold">Operations</p>
          <h1 className="font-semibold text-2xl md:text-3xl font-bold mt-1">
            Product Cost / Purchase Price Including GST
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage unit economics for your SKUs. Current report:{" "}
            <span className="font-medium text-foreground">{reportName}</span> ({periodLabel})
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" asChild>
            <Link href={`/dashboard/reports/${reportId}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Report
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={pending}
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-1" />
            Import CSV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <form onSubmit={onSearch} className="flex gap-2">
            <Input
              name="q"
              key={searchQ}
              defaultValue={searchQ}
              placeholder="Search SKU or Product Name..."
              className="rounded-xl"
            />
            <Button type="submit" variant="outline" className="rounded-xl shrink-0">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex-1 min-w-[160px] space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Common Packaging Cost Including GST (₹)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Example: 10"
                value={commonPack}
                onChange={(e) => setCommonPack(e.target.value)}
                className="rounded-xl max-w-xs"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={pending}
              onClick={() => handleSave({ fillMissingPack: true })}
            >
              Fill Missing Packaging Cost
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={pending}
              onClick={() => handleSave({ applyPackToAll: true })}
            >
              Apply to All Rows
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              Showing {start}-{end} of {total} SKU-size rows
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  disabled={page <= 1 || pending}
                  onClick={() => goPage(page - 1)}
                >
                  Previous {pageSize}
                </Button>
                <span className="text-xs font-medium px-2">
                  Page {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  disabled={page >= totalPages || pending}
                  onClick={() => goPage(page + 1)}
                >
                  Next {pageSize}
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                  <th className="p-3 font-medium w-24">SKU</th>
                  <th className="p-3 font-medium min-w-[220px]">Product Name</th>
                  <th className="p-3 font-medium w-16">Size</th>
                  <th className="p-3 font-medium min-w-[160px]">
                    Product Cost / Purchase Price Incl. GST (₹)
                  </th>
                  <th className="p-3 font-medium min-w-[160px]">Packaging Cost Incl. GST (₹)</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No SKUs match your search. Clear search or upload a report first.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr
                      key={row.id ?? `${row.sku}::${row.size}`}
                      className="border-b border-border/40 hover:bg-muted/20"
                    >
                      <td className="p-3 font-mono text-xs align-top">{row.sku}</td>
                      <td className="p-3 align-top max-w-[320px]">
                        <span className="line-clamp-3">{row.productName || "—"}</span>
                      </td>
                      <td className="p-3 align-top font-medium">{row.size || "—"}</td>
                      <td className="p-3 align-top">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          className="rounded-lg h-9 w-full max-w-[140px] font-mono text-sm"
                          value={formatCostInput(row.productCost)}
                          onChange={(e) => updateRow(i, "productCost", e.target.value)}
                        />
                      </td>
                      <td className="p-3 align-top">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          className="rounded-lg h-9 w-full max-w-[140px] font-mono text-sm"
                          value={formatCostInput(row.packCost)}
                          onChange={(e) => updateRow(i, "packCost", e.target.value)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {rows.length} of {total} SKU-size rows across {uniqueSkus} unique SKUs · Page{" "}
            {page} of {totalPages}
          </p>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 z-50 pb-4">
        <div className="rounded-2xl border border-border/70 bg-card/90 backdrop-blur px-4 py-3 shadow-lg flex items-center justify-end">
          <Button
            type="button"
            className="rounded-xl px-8 shadow-md"
            disabled={pending}
            onClick={() => handleSave()}
          >
            <Save className="h-4 w-4 mr-2" />
            {pending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
