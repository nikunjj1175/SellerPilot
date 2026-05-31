import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getOrCreateSettings } from "@/app/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MARKETPLACES } from "@/types/enums";
import { Download, ExternalLink, Mail } from "lucide-react";

const MEESHO_STEPS = [
  "Login to supplier.meesho.com",
  "Go to Payments → Settlement Reports",
  "Select date range → Download CSV",
  "Upload here on SellerPilot Reports page",
];

export default async function IntegrationsPage() {
  const session = await requireSession();
  const settings = await getOrCreateSettings(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect marketplaces — upload CSV from each platform (Phase 3)
        </p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Meesho auto-reminder
          </CardTitle>
          <CardDescription>
            {settings.meeshoAutoReminder
              ? `Email reminder on day ${settings.reminderDayOfMonth} if no report uploaded this month`
              : "Disabled — enable in Settings"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings">Configure reminders</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {MARKETPLACES.map((m) => (
          <Card key={m.id}>
            <CardHeader>
              <CardTitle>{m.label}</CardTitle>
              <CardDescription>{m.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {m.id === "MEESHO" && (
                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  {MEESHO_STEPS.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}
              {m.id === "FLIPKART" && (
                <p className="text-sm text-muted-foreground">
                  Seller Hub → Payments → Download payment report CSV
                </p>
              )}
              {m.id === "AMAZON" && (
                <p className="text-sm text-muted-foreground">
                  Seller Central → Reports → Payments → Transaction CSV
                </p>
              )}
              <div className="flex gap-2">
                <Button size="sm" asChild>
                  <Link href={`/dashboard/reports?marketplace=${m.id}`}>
                    <Download className="h-4 w-4 mr-1" />
                    Upload {m.label} CSV
                  </Link>
                </Button>
                {m.id === "MEESHO" && (
                  <Button size="sm" variant="outline" asChild>
                    <a href="https://supplier.meesho.com" target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>Phase 4 — Agency & API</CardTitle>
          <CardDescription>Multi-store management and REST API uploads</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" asChild>
            <Link href="/dashboard/agency">Agency dashboard</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/developer">Developer API keys</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
