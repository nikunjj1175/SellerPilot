import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getOrCreateSettings } from "@/app/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MEESHO_LABEL } from "@/types/enums";
import { Download, ExternalLink, Mail, FileSpreadsheet } from "lucide-react";

const MEESHO_STEPS = [
  "Login to supplier.meesho.com",
  "Download Orders CSV for your month (Payments → Orders)",
  "Download tcs_sales.xlsx from GST / TCS reports",
  "Download tcs_sales_return.xlsx for returns in same month",
  "Upload all 3 files on SellerPilot Reports page",
];

export default async function IntegrationsPage() {
  const session = await requireSession();
  const settings = await getOrCreateSettings(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Meesho File Guide</h1>
        <p className="text-muted-foreground">
          SellerPilot is built for {MEESHO_LABEL} sellers — upload 3 files for full P&L report.
        </p>
      </div>

      <Card className="border-primary/30 bg-primary/5 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Mail className="h-5 w-5" />
            Meesho upload reminder
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

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Required files
          </CardTitle>
          <CardDescription>All three files are needed for accurate GST + state-wise P&L</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm space-y-2">
            <li className="rounded-lg border px-4 py-3">
              <span className="font-medium">1. Orders CSV</span>
              <p className="text-muted-foreground text-xs mt-1">Sub Order No, SKU, Status, Customer State, Supplier Price</p>
            </li>
            <li className="rounded-lg border px-4 py-3">
              <span className="font-medium">2. tcs_sales.xlsx</span>
              <p className="text-muted-foreground text-xs mt-1">GST sale rows — taxable value, tax, shipping, state</p>
            </li>
            <li className="rounded-lg border px-4 py-3">
              <span className="font-medium">3. tcs_sales_return.xlsx</span>
              <p className="text-muted-foreground text-xs mt-1">Return / cancel GST rows for same month</p>
            </li>
          </ul>
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            {MEESHO_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="flex gap-2 pt-2">
            <Button asChild>
              <Link href="/dashboard/reports">
                <Download className="h-4 w-4 mr-1" />
                Upload Meesho files
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://supplier.meesho.com" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                supplier.meesho.com
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/demo-report">View demo report</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
