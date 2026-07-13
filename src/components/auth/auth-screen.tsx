"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Heart, Lock, Mail, Phone, User2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

export function AuthScreen({ initialMode }: { initialMode: "login" | "signup" }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"login" | "signup">(initialMode);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);

  const login = useAuth((s) => s.login);
  const signup = useAuth((s) => s.signup);
  const error = useAuth((s) => s.error);
  const setError = useAuth((s) => s.setError);
  const [submitting, setSubmitting] = React.useState(false);

  const redirectAfterAuth = () => {
    const redirect =
      new URLSearchParams(window.location.search).get("redirect") || "/shortlist";
    router.push(redirect);
  };

  React.useEffect(() => setError(null), [mode, setError]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup") {
      // Client-side validation for clear, immediate errors (server re-validates).
      let local = phone.replace(/\D/g, "");
      if (local.length === 12 && local.startsWith("91")) local = local.slice(2);
      else if (local.length === 11 && local.startsWith("0")) local = local.slice(1);
      if (!/^[6-9]\d{9}$/.test(local)) {
        setError("Enter a valid 10-digit Indian mobile number.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
    }
    setSubmitting(true);
    const ok =
      mode === "login"
        ? await login(email, password)
        : await signup(name, email, phone, password);
    setSubmitting(false);
    if (ok) redirectAfterAuth();
  };

  const isLogin = mode === "login";

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
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isLogin
                ? "Log in to access your saved properties."
                : "Sign up to save shortlists and compare faster."}
            </p>
          </div>

          {/* mode toggle */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-lg py-2 text-sm font-semibold transition-colors",
                  mode === m
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {!isLogin && (
              <Field icon={User2} label="Full name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aman Sharma"
                  autoComplete="name"
                  className="auth-input"
                />
              </Field>
            )}
            <Field icon={Mail} label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="auth-input"
              />
            </Field>
            {!isLogin && (
              <Field icon={Phone} label="Phone number">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  autoComplete="tel"
                  inputMode="numeric"
                  className="auth-input"
                />
              </Field>
            )}
            <Field icon={Lock} label="Password">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="auth-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Field>
            {!isLogin && (
              <Field icon={Lock} label="Confirm password">
                <input
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="auth-input"
                />
              </Field>
            )}

            {isLogin && (
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger"
              >
                {error}
              </p>
            )}

            <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitting}>
              <Heart className="h-4 w-4" />
              {submitting ? "Please wait…" : isLogin ? "Log in" : "Create account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {isLogin ? "New to Creators Arena? " : "Already have an account? "}
            <button
              onClick={() => setMode(isLogin ? "signup" : "login")}
              className="font-semibold text-accent hover:underline"
            >
              {isLogin ? "Create an account" : "Log in"}
            </button>
          </p>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Your account is stored securely. We never share your details.{" "}
          <Link href="/" className="underline-offset-2 hover:underline">
            Back home
          </Link>
        </p>
      </div>

      <style jsx global>{`
        .auth-input {
          height: 2.75rem;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding-left: 2.5rem;
          padding-right: 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .auth-input:focus {
          box-shadow: 0 0 0 2px hsl(var(--accent) / 0.4);
        }
      `}</style>
    </section>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </span>
    </label>
  );
}
