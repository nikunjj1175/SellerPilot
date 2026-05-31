import { requireSession } from "@/lib/session";
import { getOrCreateSettings } from "@/app/actions/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { isEmailConfigured } from "@/lib/email";
import { isOpenAiConfigured } from "@/lib/openai-insights";
import { isWhatsAppApiConfigured } from "@/lib/whatsapp";

export default async function SettingsPage() {
  const session = await requireSession();
  const settings = await getOrCreateSettings(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Profile, notifications & marketplace connections</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Name:</span> {session.user.name ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span> {session.user.email}
          </p>
          <p>
            <span className="text-muted-foreground">Role:</span> {session.user.role}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            settings={{
              meeshoSellerId: settings.meeshoSellerId,
              meeshoAutoReminder: settings.meeshoAutoReminder,
              reminderDayOfMonth: settings.reminderDayOfMonth,
              emailReportsEnabled: settings.emailReportsEnabled,
              whatsappReportsEnabled: settings.whatsappReportsEnabled,
              whatsappPhone: settings.whatsappPhone,
              weeklyDigestEnabled: settings.weeklyDigestEnabled,
              connectedMarketplaces: settings.connectedMarketplaces,
            }}
            emailConfigured={isEmailConfigured()}
            whatsappApiConfigured={isWhatsAppApiConfigured()}
            openAiConfigured={isOpenAiConfigured()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
