"use client";

import { useRef, useTransition } from "react";
import { uploadAndProcessReport } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Info } from "lucide-react";

type StoreOption = { id: string; name: string; marketplace: string };

const EXCEL_ACCEPT = ".xlsx,.xls,.csv,.txt";

export function ReportUploadForm({ stores = [] }: { stores?: StoreOption[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      formData.set("marketplace", "MEESHO");
      const result = await uploadAndProcessReport(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        "message" in result && result.message
          ? String(result.message)
          : "Meesho P&L report processed!"
      );
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="space-y-4 max-w-xl">
      <input type="hidden" name="marketplace" value="MEESHO" />
      <input type="hidden" name="meeshoMode" value="multi" />

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
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Report name</Label>
        <Input id="name" name="name" placeholder="April 2026 Meesho P&L" />
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

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4">
        <div className="flex gap-2 text-sm">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-primary">Meesho 3-file P&L</p>
            <p className="text-muted-foreground text-xs mt-1">
              supplier.meesho.com → Download: <strong>Orders CSV</strong>,{" "}
              <strong>tcs_sales.xlsx</strong>, <strong>tcs_sales_return.xlsx</strong>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ordersFile" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" /> 1. Orders CSV (Orders_*.csv)
          </Label>
          <Input id="ordersFile" name="ordersFile" type="file" accept={EXCEL_ACCEPT} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gstSaleFile" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" /> 2. GST Sale (tcs_sales.xlsx)
          </Label>
          <Input id="gstSaleFile" name="gstSaleFile" type="file" accept={EXCEL_ACCEPT} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gstReturnFile" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" /> 3. GST Sale Return (tcs_sales_return.xlsx)
          </Label>
          <Input id="gstReturnFile" name="gstReturnFile" type="file" accept={EXCEL_ACCEPT} />
          <p className="text-xs text-muted-foreground">Recommended for accurate returns & GST</p>
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Processing P&L..." : "Upload & Generate Meesho P&L"}
      </Button>
    </form>
  );
}
