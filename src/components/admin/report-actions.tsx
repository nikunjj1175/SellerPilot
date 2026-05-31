"use client";

import { useTransition } from "react";
import { adminDeleteReport } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function AdminReportActions({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await adminDeleteReport(reportId);
          toast.success("Report deleted");
        })
      }
    >
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  );
}
