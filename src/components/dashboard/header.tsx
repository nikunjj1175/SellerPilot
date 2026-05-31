"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut, Coins } from "lucide-react";
import { useTheme } from "next-themes";

export function DashboardHeader() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-4 md:px-6">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <p className="font-semibold">{session?.user?.name ?? session?.user?.email}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-sm sm:flex">
          <Coins className="h-4 w-4 text-primary" />
          <span>{session?.user?.credits ?? 0} credits</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
