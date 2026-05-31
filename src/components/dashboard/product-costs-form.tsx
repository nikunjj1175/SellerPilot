"use client";

import { useMemo, useState, useTransition } from "react";
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
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState(initialRows);
  const [commonPack, setCommonPack] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const searchQ = searchParams.get("q") ?? "";

  function updateRow(index: number, field: "productCost" | "packCost", value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: parseFloat(value) || 0 };
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
    const q = String(fd.get("q") ?? "");
    const p = new URLSearchParams();
    p.set("report", reportId);
    if (q) p.set("q", q);
    router.push(`/dashboard/product-costs?${p.toString()}`);
  }

  function handleSave(extra?: { fillMissingPack?: boolean; applyPackToAll?: boolean }) {
    startTransition(async () => {
      const packVal = parseFloat(commonPack) || 0;
      const res = await saveProductCosts(reportId, rows, {
        commonPackCost: packVal,
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

  const periodLabel = useMemo(() => reportPeriod.slice(0, 7), [reportPeriod]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-primary font-semibold">Operations</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold mt-1">
            Product Cost / Purchase Price Including GST
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage unit economics for your SKUs. Current report:{" "}
            <span className="font-medium text-foreground">{reportName}</span> ({periodLabel})
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/reports/${reportId}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Report
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const csv = await exportProductCostsCsv(reportId);
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `product-costs-${reportId}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              })
            }
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <label className="inline-flex">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-1" />
                Import CSV
              </span>
            </Button>
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  startTransition(async () => {
                    const res = await importProductCostsCsv(reportId, String(reader.result));
                    if ("error" in res && res.error) toast.error(res.error);
                    else {
                      toast.success("CSV imported");
                      router.refresh();
                    }
                  });
                };
                reader.readAsText(file);
              }}
            />
          </label>
        </div>
      </div>

      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <form onSubmit={onSearch} className="flex gap-2">
            <Input
              name="q"
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
              Showing {start}-{end} of {total} SKU-size rows across {uniqueSkus} unique SKUs · Page{" "}
              {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
              >
                Previous {pageSize}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page >= totalPages}
                onClick={() => goPage(page + 1)}
              >
                Next {pageSize}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                  <th className="p-3 font-medium">SKU</th>
                  <th className="p-3 font-medium min-w-[200px]">Product Name</th>
                  <th className="p-3 font-medium w-20">Size</th>
                  <th className="p-3 font-medium min-w-[140px]">
                    Product Cost / Purchase Price Incl. GST (₹)
                  </th>
                  <th className="p-3 font-medium min-w-[140px]">Packaging Cost Incl. GST (₹)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`${row.sku}-${row.size}-${i}`} className="border-b border-border/40">
                    <td className="p-3 font-mono text-xs">{row.sku}</td>
                    <td className="p-3 max-w-[280px]">
                      <span className="line-clamp-2">{row.productName}</span>
                    </td>
                    <td className="p-3">{row.size || "—"}</td>
                    <td className="p-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="rounded-lg h-9 w-full max-w-[120px]"
                        value={row.productCost || ""}
                        onChange={(e) => updateRow(i, "productCost", e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="rounded-lg h-9 w-full max-w-[120px]"
                        value={row.packCost || ""}
                        onChange={(e) => updateRow(i, "packCost", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {rows.length} of {total} SKU-size rows across {uniqueSkus} unique SKUs · Page{" "}
            {page} of {totalPages}
          </p>

          <div className="flex justify-end pt-2">
            <Button
              className="rounded-xl px-8 shadow-md"
              disabled={pending}
              onClick={() => handleSave()}
            >
              <Save className="h-4 w-4 mr-2" />
              {pending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
