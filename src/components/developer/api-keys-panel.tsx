"use client";

import { useState, useTransition } from "react";
import { createApiKey, revokeApiKey } from "@/app/actions/agency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy } from "lucide-react";

type KeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  active: boolean;
  lastUsedAt?: string;
  createdAt: string;
};

export function ApiKeysPanel({ keys }: { keys: KeyRow[] }) {
  const [pending, startTransition] = useTransition();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");

  return (
    <div className="space-y-6">
      <div className="space-y-3 max-w-md">
        <Label>New API key</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Key name e.g. Production"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
          />
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await createApiKey(keyName);
                if (res.error) toast.error(res.error);
                else if (res.apiKey) {
                  setNewKey(res.apiKey);
                  setKeyName("");
                  toast.success("Key created — copy it now!");
                }
              })
            }
          >
            Generate
          </Button>
        </div>
        {newKey && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400 mb-2">
              Copy now — shown once only
            </p>
            <code className="break-all text-xs">{newKey}</code>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                navigator.clipboard.writeText(newKey);
                toast.success("Copied");
              }}
            >
              <Copy className="h-3 w-3 mr-1" /> Copy
            </Button>
          </div>
        )}
      </div>

      <ul className="space-y-2">
        {keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No API keys yet.</p>
        ) : (
          keys.map((k) => (
            <li
              key={k.id}
              className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
            >
              <div>
                <p className="font-medium">{k.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{k.keyPrefix}</p>
              </div>
              {k.active ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await revokeApiKey(k.id);
                      toast.success("Key revoked");
                    })
                  }
                >
                  Revoke
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">Revoked</span>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
