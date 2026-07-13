"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setLoading(false);
    setSent(true);
  };

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-grid px-4 py-12">
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-accent/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-primary/20 blur-[130px] dark:bg-accent/15" />

      <div className="relative w-full max-w-md">
        <div className="glass rounded-3xl p-8 shadow-lift">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="text-primary dark:text-foreground">
              <Logo />
            </span>
            <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-primary dark:text-foreground">
              {sent ? "Check your email" : "Forgot your password?"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {sent
                ? "If an account exists for that email, we've sent a link to reset your password. The link expires in 1 hour."
                : "Enter your email and we'll send you a link to reset your password."}
            </p>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
                <MailCheck className="h-7 w-7" />
              </span>
              <Link href="/login" className="w-full">
                <Button variant="accent" size="lg" className="w-full">
                  Back to log in
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Email
                </span>
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none ring-accent/40 focus:ring-2"
                  />
                </span>
              </label>
              <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          <Link href="/login" className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Back to log in
          </Link>
        </p>
      </div>
    </section>
  );
}
