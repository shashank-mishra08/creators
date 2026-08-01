"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuthNav } from "@/components/auth/auth-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Properties" },
  // The slot-based compare: it starts empty and is driven by its own
  // dropdowns, which is what a visitor arriving from the nav wants. The
  // selection-based /compare is reached from the tray on the listing page,
  // where the selection is actually built.
  { href: "/compare/quick", label: "Compare" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);

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
          {/* The source PNG is 612×407 but the mark inside it is only 352×192 —
              53% of the height is transparent padding, so a box sized to the
              64px bar rendered a mark barely 26px tall. The box is deliberately
              taller than the bar: the overflow is transparent, so nothing shows,
              and the mark lands at a readable size. `mt` re-centres it, since
              the padding is uneven (81px above the mark, 134px below). */}
          <Logo imageClassName="h-16 sm:h-[76px] mt-0 translate-y-[7px] sm:translate-y-[6px]" />
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
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  active && "text-foreground",
                )}
              >
                {item.label}
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
