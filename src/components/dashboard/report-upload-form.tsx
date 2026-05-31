"use client";

import { useRef, useTransition, useState } from "react";
import { useSearchParams } from "next/navigation";
import { uploadAndProcessReport } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MARKETPLACES } from "@/types/enums";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Info } from "lucide-react";

type StoreOption = { id: string; name: string; marketplace: string };

const EXCEL_ACCEPT = ".xlsx,.xls,.csv,.txt";

export function ReportUploadForm({ stores = [] }: { stores?: StoreOption[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultMarketplace = searchParams.get("marketplace") ?? "MEESHO";
  const [marketplace, setMarketplace] = useState(defaultMarketplace);
  const isMeesho = marketplace === "MEESHO";

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await uploadAndProcessReport(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        "message" in result && result.message
          ? String(result.message)
          : "Report processed successfully!"
      );
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="space-y-4 max-w-xl">
      {stores.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="storeId">Client store (agency)</Label>
          <select
            id="storeId"
            name="storeId"
            className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="">— My account (no store) —</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.marketplace})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="marketplace">Marketplace</Label>
        <select
          id="marketplace"
          name="marketplace"
          value={marketplace}
          onChange={(e) => setMarketplace(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
        >
          {MARKETPLACES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Report name</Label>
        <Input id="name" name="name" placeholder="Jan 2026 Meesho P&L" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Report type</Label>
        <select
          id="type"
          name="type"
          className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="MONTHLY">Monthly (2 credits)</option>
          <option value="QUARTERLY">Quarterly (5 credits)</option>
          <option value="YEARLY">Yearly (10 credits)</option>
          <option value="CUSTOM">Custom (2 credits)</option>
        </select>
      </div>

      {(marketplace === "MEESHO") && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4">
          <div className="flex gap-2 text-sm">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary">Meesho 3-file P&L (recommended)</p>
              <p className="text-muted-foreground text-xs mt-1">
                supplier.meesho.com → Payments → Download:{" "}
                <strong>Orders</strong> + <strong>GST Report</strong> (tcs_sales & tcs_sales_return)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ordersFile" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" /> 1. Total Orders Excel
            </Label>
            <Input
              id="ordersFile"
              name="ordersFile"
              type="file"
              accept={EXCEL_ACCEPT}
              required={isMeesho}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstSaleFile" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" /> 2. GST Sale (tcs_sales.xlsx)
            </Label>
            <Input
              id="gstSaleFile"
              name="gstSaleFile"
              type="file"
              accept={EXCEL_ACCEPT}
              required={isMeesho}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstReturnFile" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" /> 3. GST Sale Return (tcs_sales_return.xlsx)
            </Label>
            <Input id="gstReturnFile" name="gstReturnFile" type="file" accept={EXCEL_ACCEPT} />
            <p className="text-xs text-muted-foreground">Optional but recommended for accurate returns P&L</p>
          </div>
        </div>
      )}

      {marketplace !== "MEESHO" && (
        <div className="space-y-2">
          <Label htmlFor="file">Settlement CSV / Excel</Label>
          <Input id="file" name="file" type="file" accept={EXCEL_ACCEPT} required />
        </div>
      )}

      {/* Hidden fallback for Meesho single-file legacy */}
      {isMeesho && (
        <input type="hidden" name="meeshoMode" value="multi" />
      )}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Processing P&L..." : "Upload & Generate P&L"}
      </Button>
    </form>
  );
}
