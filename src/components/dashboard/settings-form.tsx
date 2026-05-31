"use client";

import { useTransition } from "react";
import { updateUserSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MARKETPLACES, type Marketplace } from "@/types/enums";
import { toast } from "sonner";
type SettingsData = {
  meeshoSellerId?: string;
  meeshoAutoReminder: boolean;
  reminderDayOfMonth: number;
  emailReportsEnabled: boolean;
  whatsappReportsEnabled: boolean;
  whatsappPhone?: string;
  weeklyDigestEnabled: boolean;
  connectedMarketplaces: Marketplace[];
};

export function SettingsForm({
  settings,
  emailConfigured,
  whatsappApiConfigured,
  openAiConfigured,
}: {
  settings: SettingsData;
  emailConfigured: boolean;
  whatsappApiConfigured: boolean;
  openAiConfigured: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-6 max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await updateUserSettings(new FormData(e.currentTarget));
          if (result.error) toast.error(result.error);
          else toast.success("Settings saved");
        });
      }}
    >
      <div className="space-y-3">
        <h3 className="font-semibold">Marketplaces</h3>
        <p className="text-sm text-muted-foreground">Select platforms you sell on</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {MARKETPLACES.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm border border-border rounded-lg p-3">
              <input
                type="checkbox"
                name="marketplaces"
                value={m.id}
                defaultChecked={settings.connectedMarketplaces.includes(m.id)}
              />
              {m.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <h3 className="font-semibold">Meesho auto-reminder</h3>
        <p className="text-sm text-muted-foreground">
          Email on day {settings.reminderDayOfMonth} each month if no report uploaded
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="meeshoAutoReminder" defaultChecked={settings.meeshoAutoReminder} />
          Enable monthly upload reminder
        </label>
        <div className="space-y-2">
          <Label htmlFor="meeshoSellerId">Meesho Seller ID (optional)</Label>
          <Input id="meeshoSellerId" name="meeshoSellerId" defaultValue={settings.meeshoSellerId} placeholder="For your records" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reminderDayOfMonth">Reminder day (1–28)</Label>
          <Input
            id="reminderDayOfMonth"
            name="reminderDayOfMonth"
            type="number"
            min={1}
            max={28}
            defaultValue={settings.reminderDayOfMonth}
          />
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <h3 className="font-semibold">Notifications</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="emailReportsEnabled" defaultChecked={settings.emailReportsEnabled} />
          Auto-email when report completes (free)
        </label>
        {!emailConfigured && (
          <p className="text-xs text-amber-600">Add RESEND_API_KEY for email</p>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="weeklyDigestEnabled" defaultChecked={settings.weeklyDigestEnabled} />
          Weekly digest (via cron)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="whatsappReportsEnabled" defaultChecked={settings.whatsappReportsEnabled} />
          WhatsApp reports enabled
        </label>
        <div className="space-y-2">
          <Label htmlFor="whatsappPhone">WhatsApp number (91XXXXXXXXXX)</Label>
          <Input id="whatsappPhone" name="whatsappPhone" defaultValue={settings.whatsappPhone} placeholder="919876543210" />
        </div>
        {!whatsappApiConfigured && (
          <p className="text-xs text-muted-foreground">Without Twilio, use Share button (wa.me link)</p>
        )}
      </div>

      <div className="text-xs text-muted-foreground border-t border-border pt-4">
        AI Insights: {openAiConfigured ? "OpenAI enabled ✓" : "Add OPENAI_API_KEY for GPT insights"}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
