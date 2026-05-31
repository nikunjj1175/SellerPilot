"use client";

import { useTransition } from "react";
import { sendReportByEmail, sendReportByWhatsApp } from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export function ReportNotifyButtons({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        title="Send email (1 credit)"
        onClick={() =>
          startTransition(async () => {
            const res = await sendReportByEmail(reportId);
            if (res.error) toast.error(res.error);
            else toast.success("Email sent!");
          })
        }
      >
        <Mail className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        title="WhatsApp (1 credit)"
        onClick={() =>
          startTransition(async () => {
            const res = await sendReportByWhatsApp(reportId);
            if (res.error) toast.error(res.error);
            else if ("shareUrl" in res && res.shareUrl) {
              window.open(res.shareUrl, "_blank");
              toast.success("Opening WhatsApp…");
            } else toast.success("WhatsApp sent!");
          })
        }
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
    </>
  );
}
