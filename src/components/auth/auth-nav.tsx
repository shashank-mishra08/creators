"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, selectShortlistIds } from "@/store/auth";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

export function AuthNav() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const logout = useAuth((s) => s.logout);
  const savedCount = useAuth(selectShortlistIds).length;
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Stable placeholder until mounted AND the session has been restored (/me),
  // so we don't flash "Log in" before a returning user is recognised.
  if (!mounted || !ready) {
    return <div className="h-10 w-[140px]" aria-hidden />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Log in
          </Button>
        </Link>
        <Link href="/signup">
          <Button variant="accent" size="sm">
            Sign up
          </Button>
        </Link>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/shortlist"
        aria-label="Saved properties"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/40 text-foreground transition-colors hover:bg-muted"
      >
        <Heart className="h-[18px] w-[18px]" />
        {savedCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
            {savedCount}
          </span>
        )}
      </Link>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-xl border border-border bg-background/40 py-1.5 pl-1.5 pr-3 transition-colors hover:bg-muted"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">
            {initials}
          </span>
          <span className="hidden max-w-[90px] truncate text-sm font-semibold sm:block">
            {user.name.split(" ")[0]}
          </span>
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-lift">
            <div className="border-b border-border px-4 py-3">
              <div className="truncate text-sm font-bold text-foreground">{user.name}</div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
            <Link
              href="/shortlist"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-accent" /> Saved properties
              </span>
              <span className="text-xs text-muted-foreground">{savedCount}</span>
            </Link>
            <button
              onClick={() => {
                logout();
                setOpen(false);
                router.push("/");
              }}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-danger hover:bg-muted",
              )}
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
