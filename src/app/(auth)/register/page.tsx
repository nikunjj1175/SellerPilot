"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";
import { registerUser } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function AuthTabs({ mode }: { mode: "login" | "register" }) {
  return (
    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted mb-6">
      <Link
        href="/login"
        className={cn(
          "rounded-lg py-2.5 text-center text-sm font-semibold transition",
          mode === "login"
            ? "bg-primary text-primary-foreground shadow"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Login
      </Link>
      <Link
        href="/register"
        className={cn(
          "rounded-lg py-2.5 text-center text-sm font-semibold transition",
          mode === "register"
            ? "bg-primary text-primary-foreground shadow"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Create Account
      </Link>
    </div>
  );
}

export default function RegisterPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await registerUser(formData);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <AuthShell
      title="Create your SellerPilot account"
      subtitle="Use Google or continue with email to generate your Meesho P&L report."
      footerLink={
        <Link href="/demo-report" className="text-sm font-semibold text-primary hover:underline">
          View sample report first
        </Link>
      }
    >
      <AuthTabs mode="register" />
      <Button
        variant="outline"
        className="w-full rounded-xl h-11"
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        Continue with Google
      </Button>
      <div className="relative my-6 text-center text-xs text-muted-foreground uppercase tracking-wider">
        <span className="relative z-10 bg-card px-3">or</span>
        <div className="absolute inset-x-0 top-1/2 border-t border-border" />
      </div>
      <form action={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required autoComplete="name" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" name="phone" type="tel" placeholder="91XXXXXXXXXX" className="rounded-xl" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
            className="rounded-xl"
          />
          <p className="text-xs text-muted-foreground">Min 8 characters, include a letter and a number</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full rounded-xl h-11 shadow-md" disabled={pending}>
          {pending ? "Creating..." : "Create Account"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}
