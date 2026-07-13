"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const router = useRouter();

  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "Could not reset your password.");
      return;
    }
    // Reset signs the user in (session cookie) — refresh the store and continue.
    await useAuth.getState().hydrate();
    router.push("/shortlist");
  };

  return (
    <div className="glass rounded-3xl p-8 shadow-lift">
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="text-primary dark:text-foreground">
          <Logo />
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-primary dark:text-foreground">
          Set a new password
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>
      </div>

      {!token ? (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-center text-sm font-medium text-danger">
          This reset link is missing its token. Please request a new one.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              New password
            </span>
            <span className="relative block">
              <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm outline-none ring-accent/40 focus:ring-2"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger"
            >
              {error}
            </p>
          )}

          <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Reset password"}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-grid px-4 py-12">
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-accent/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-primary/20 blur-[130px] dark:bg-accent/15" />
      <div className="relative w-full max-w-md">
        <React.Suspense fallback={<div className="h-80" />}>
          <ResetForm />
        </React.Suspense>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          <Link href="/login" className="underline-offset-2 hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </section>
  );
}
