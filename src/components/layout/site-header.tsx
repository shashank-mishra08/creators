"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuthNav } from "@/components/auth/auth-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useComparison } from "@/store/comparison";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Properties" },
  { href: "/compare", label: "Compare" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const mounted = useMounted();
  const [scrolled, setScrolled] = React.useState(false);
  // Persisted (localStorage) store — only trust it after mount so the first
  // client render matches the server HTML and hydration doesn't mismatch.
  const count = useComparison((s) => s.selected.length);
  const badge = mounted ? count : 0;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="container flex h-16 items-center gap-6">
        <Link href="/" className="shrink-0 text-primary dark:text-foreground">
          {/* Logo defaults to h-28, which overflows this h-16 bar and eats ~168px
              of a phone viewport. Size it to the bar instead. */}
          <Logo imageClassName="h-11 sm:h-14 mt-0" />
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href.split("#")[0]) &&
                  item.href !== "/";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  active && "text-foreground",
                )}
              >
                {item.label}
                {/* The selection count rides on this link now. There used to be
                    a second "Compare" button on the right of the bar, but it
                    only linked to /properties — two controls with the same word
                    and different destinations. */}
                {item.href === "/compare" && badge > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-foreground">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {/* Desktop auth cluster; tablet/mobile use the drawer below. */}
          <div className="hidden lg:block">
            <AuthNav />
          </div>
          <MobileNav nav={NAV} />
        </div>
      </div>
    </header>
  );
}
