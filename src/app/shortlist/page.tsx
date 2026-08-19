"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GitCompareArrows,
  Heart,
  Loader2,
  MapPin,
  MessageSquareQuote,
  Star,
  Trash2,
} from "lucide-react";
import { useAuth, selectShortlistIds } from "@/store/auth";
import { useComparison } from "@/store/comparison";
import { useMounted } from "@/lib/use-mounted";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { MyReviewCard, ReviewForm } from "@/components/reviews/review-form";
import { cn, formatPriceLakh } from "@/lib/utils";
import type { Property } from "@/lib/types";
import type { MyReviewsResult } from "@/lib/services/review.service";

type Tab = "wishlist" | "review";

/**
 * The account area reached from the heart in the header: saved properties and
 * the review form, as two tabs behind one sidebar.
 *
 * The tab lives in the URL (`?tab=review`) so it survives a refresh and can be
 * linked to directly, and so the browser back button steps between tabs.
 */
export default function ShortlistPage() {
  const mounted = useMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);

  const tab: Tab = searchParams.get("tab") === "review" ? "review" : "wishlist";
  const setTab = (next: Tab) =>
    router.replace(next === "review" ? "/shortlist?tab=review" : "/shortlist", {
      scroll: false,
    });

  // Wait for both mount and the /me hydration, otherwise a returning user sees
  // the "log in" prompt flash before their session is recognised.
  if (!mounted || !ready) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (!user) return <SignedOutPrompt tab={tab} />;

  return (
    <div className="container py-8 md:py-10">
      <div className="grid gap-6 lg:grid-cols-[248px_1fr] lg:gap-8">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:h-fit">
          <nav className="flex gap-2 rounded-2xl border border-border bg-card p-2 shadow-glass lg:flex-col">
            <SidebarTab
              active={tab === "wishlist"}
              onClick={() => setTab("wishlist")}
              icon={Heart}
              label="Wishlist"
            />
            <SidebarTab
              active={tab === "review"}
              onClick={() => setTab("review")}
              icon={Star}
              label="Add Review"
            />
          </nav>

          <div className="hidden rounded-2xl border border-border bg-card p-4 shadow-glass lg:block">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <MessageSquareQuote className="h-5 w-5 text-accent" />
            </span>
            <h2 className="mt-3 font-display text-sm font-bold text-primary dark:text-foreground">
              Help us improve!
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Your review helps other buyers make better decisions.
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          {tab === "wishlist" ? <WishlistTab /> : <ReviewTab />}
        </div>
      </div>
    </div>
  );
}

function SidebarTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors lg:flex-none",
        active
          ? "bg-accent/10 text-accent"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4", active && "fill-accent/25")} />
      {label}
    </button>
  );
}

/* ───────────────────────────── wishlist ───────────────────────────── */

function WishlistTab() {
  const user = useAuth((s) => s.user);
  const toggleShortlist = useAuth((s) => s.toggleShortlist);
  const savedIds = useAuth(selectShortlistIds);
  const inCompare = useComparison((s) => s.selected);
  const toggleCompare = useComparison((s) => s.toggle);

  const [saved, setSaved] = React.useState<Property[]>([]);
  const savedKey = savedIds.join(",");
  React.useEffect(() => {
    if (!user || savedIds.length === 0) {
      setSaved([]);
      return;
    }
    let cancelled = false;
    api
      .propertiesByIds(savedIds)
      .then((props) => {
        if (!cancelled) setSaved(props);
      })
      .catch(() => {
        if (!cancelled) setSaved([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, savedKey]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-primary dark:text-foreground sm:text-3xl">
            <Heart className="h-6 w-6 fill-accent text-accent" /> Saved properties
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Hi {user?.name.split(" ")[0]} — you have{" "}
            <strong className="text-foreground">{saved.length}</strong> saved{" "}
            {saved.length === 1 ? "property" : "properties"}.
          </p>
        </div>
        <Link href="/properties">
          <Button variant="outline" size="md">Browse more</Button>
        </Link>
      </div>

      {saved.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center">
          <p className="font-display text-lg font-bold">Nothing saved yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the heart on any property to save it here.
          </p>
          <Link href="/properties" className="mt-4 inline-block">
            <Button variant="accent" size="sm">Explore properties</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((p) => (
            <div
              key={p.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-glass"
            >
              <div className="relative h-44 w-full">
                <CoverImage src={p.image} alt={p.name} gradient={p.gradient} label={p.name} sizes="360px" />
                <button
                  onClick={() => toggleShortlist(p.id)}
                  aria-label="Remove from saved"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-danger shadow-sm backdrop-blur hover:bg-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display text-base font-bold text-primary dark:text-foreground">
                  {p.name}
                </h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 text-accent" /> {p.locality}
                </p>
                <div className="mt-2 font-display text-lg font-extrabold text-accent">
                  {formatPriceLakh(p.priceLakh)}
                  <span className="text-xs font-medium text-muted-foreground">*</span>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                  <button
                    onClick={() => toggleCompare(p.id)}
                    className={cn(
                      "inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                      inCompare.includes(p.id)
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-foreground hover:bg-muted",
                    )}
                  >
                    <GitCompareArrows className="h-3.5 w-3.5" />
                    {inCompare.includes(p.id) ? "Added" : "Compare"}
                  </button>
                  <Link href={`/properties/${p.slug || p.id}`}>
                    <Button variant="accent" size="sm" className="w-full">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ───────────────────────────── reviews ───────────────────────────── */

function ReviewTab() {
  const [data, setData] = React.useState<MyReviewsResult | null>(null);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(() => {
    setFailed(false);
    api
      .myReviews()
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  React.useEffect(() => load(), [load]);

  return (
    <div className="space-y-6">
      {/* The form does not wait on this request — an empty popular list simply
          falls back to the catalogue, so a slow response never blocks writing. */}
      <ReviewForm popularIds={data?.popularPropertyIds ?? []} onSubmitted={load} />

      <section>
        <h2 className="font-display text-lg font-bold text-primary dark:text-foreground">
          Your reviews
        </h2>

        {failed ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Couldn&apos;t load your reviews.{" "}
            <button onClick={load} className="font-semibold text-accent hover:underline">
              Retry
            </button>
          </p>
        ) : !data ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : data.reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            You haven&apos;t written a review yet. The form above is the place to start.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {data.reviews.map((r) => (
              <MyReviewCard key={r.id} review={r} onDeleted={load} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ───────────────────────────── signed out ───────────────────────────── */

function SignedOutPrompt({ tab }: { tab: Tab }) {
  const redirect = tab === "review" ? "/shortlist?tab=review" : "/shortlist";
  const reviewing = tab === "review";
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
        {reviewing ? (
          <Star className="h-7 w-7 text-accent" />
        ) : (
          <Heart className="h-7 w-7 text-accent" />
        )}
      </div>
      <h1 className="font-display text-2xl font-extrabold text-primary dark:text-foreground">
        {reviewing ? "Sign in to write a review" : "Save properties you love"}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {reviewing
          ? "Reviews are published under your name, so we need to know who you are first."
          : "Log in or create a free account to shortlist properties and pick up right where you left off."}
      </p>
      <div className="mt-6 flex gap-3">
        <Link href={`/login?redirect=${encodeURIComponent(redirect)}`}>
          <Button variant="outline" size="md">Log in</Button>
        </Link>
        <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`}>
          <Button variant="accent" size="md">Sign up</Button>
        </Link>
      </div>
    </div>
  );
}
