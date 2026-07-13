"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GitCompareArrows, Heart, MapPin, Trash2 } from "lucide-react";
import { useAuth, selectShortlistIds } from "@/store/auth";
import { useComparison } from "@/store/comparison";
import { useMounted } from "@/lib/use-mounted";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { cn, formatPriceLakh } from "@/lib/utils";
import type { Property } from "@/lib/types";

export default function ShortlistPage() {
  const mounted = useMounted();
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

  if (!mounted) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  // Logged out → prompt
  if (!user) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
          <Heart className="h-7 w-7 text-accent" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-primary dark:text-foreground">
          Save properties you love
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Log in or create a free account to shortlist properties and pick up
          right where you left off.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/login?redirect=/shortlist">
            <Button variant="outline" size="md">Log in</Button>
          </Link>
          <Link href="/signup?redirect=/shortlist">
            <Button variant="accent" size="md">Sign up</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold tracking-tight text-primary dark:text-foreground sm:text-4xl">
            <Heart className="h-7 w-7 fill-accent text-accent" /> Saved properties
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Hi {user.name.split(" ")[0]} — you have{" "}
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
                  <Link href={`/properties/${p.id}`}>
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
    </div>
  );
}
