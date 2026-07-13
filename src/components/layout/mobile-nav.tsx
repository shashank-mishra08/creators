"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GitCompareArrows, Heart, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { useAuth, selectShortlistIds } from "@/store/auth";
import { useComparison } from "@/store/comparison";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

/**
 * Mobile navigation drawer (hamburger). Rendered only below `md`; the desktop
 * header (inline nav + AuthNav) is unchanged. Holds the nav links, the compare
 * shortcut and the auth actions so nothing is unreachable on small screens.
 */
export function MobileNav({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useMounted();
  const [open, setOpen] = React.useState(false);

  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const logout = useAuth((s) => s.logout);
  const savedCount = useAuth(selectShortlistIds).length;
  const compareCount = useComparison((s) => s.selected.length);
  const compareBadge = mounted ? compareCount : 0;

  // Close on route change.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll + close on ESC while open.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/40 text-foreground transition-colors hover:bg-muted"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      {/* Overlay + drawer. `overflow-hidden` clips the off-screen (closed)
          drawer so its transform can't create horizontal page scroll. */}
      <div
        className={cn(
          "fixed inset-0 z-[60] overflow-hidden",
          open ? "" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cn(
            "absolute right-0 top-0 flex h-full w-[82%] max-w-xs flex-col border-l border-border bg-background shadow-lift transition-transform duration-300 will-change-transform",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <span className="text-primary dark:text-foreground">
              <Logo />
            </span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 p-4">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href.split("#")[0]);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-xl px-4 py-3 text-base font-semibold transition-colors",
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/shortlist"
              className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-accent" /> Saved
              </span>
              {mounted && savedCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-foreground">
                  {savedCount}
                </span>
              )}
            </Link>
          </nav>

          <div className="mt-auto border-t border-border p-4">
            {mounted && ready && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-foreground">
                    {user.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-foreground">
                      {user.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    logout();
                    setOpen(false);
                    router.push("/");
                  }}
                >
                  <LogOut className="h-4 w-4" /> Log out
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login">
                  <Button variant="outline" size="md" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="accent" size="md" className="w-full">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
            <Link href="/compare" className="mt-3 block">
              <Button variant="ghost" size="sm" className="w-full justify-start gap-1.5">
                <GitCompareArrows className="h-4 w-4" /> Compare
                {compareBadge > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-foreground">
                    {compareBadge}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
