import { requireSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { ApiKey, type IApiKey } from "@/models/ApiKey";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ApiKeysPanel } from "@/components/developer/api-keys-panel";

const APP_URL = process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";

export default async function DeveloperPage() {
  const session = await requireSession();
  await connectDB();

  const keys = await ApiKey.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean<IApiKey[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Developer API</h1>
        <p className="text-muted-foreground">Upload reports programmatically from your scripts or ERP</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Use Bearer token authentication</CardDescription>
        </CardHeader>
        <CardContent>
          <ApiKeysPanel
            keys={keys.map((k) => ({
              id: k._id.toString(),
              name: k.name,
              keyPrefix: k.keyPrefix,
              active: k.active,
              lastUsedAt: k.lastUsedAt?.toISOString(),
              createdAt: k.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm font-mono">
          <div>
            <p className="text-muted-foreground font-sans mb-1">Account info</p>
            <code>GET {APP_URL}/api/v1/account</code>
            <p className="font-sans text-muted-foreground mt-1">Header: Authorization: Bearer sp_live_xxx</p>
          </div>
          <div>
            <p className="text-muted-foreground font-sans mb-1">List reports</p>
            <code>GET {APP_URL}/api/v1/reports</code>
          </div>
          <div>
            <p className="text-muted-foreground font-sans mb-1">Upload CSV (multipart)</p>
            <code>POST {APP_URL}/api/v1/reports</code>
            <p className="font-sans text-muted-foreground mt-1">
              Fields: ordersFile, gstSaleFile, gstReturnFile, marketplace=MEESHO, name, type, storeId (optional)
            </p>
          </div>
          <pre className="rounded-lg bg-muted p-4 text-xs overflow-x-auto font-sans">{`curl -X POST "${APP_URL}/api/v1/reports" \\
  -H "Authorization: Bearer sp_live_YOUR_KEY" \\
  -F "file=@settlement.csv" \\
  -F "marketplace=MEESHO"`}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
