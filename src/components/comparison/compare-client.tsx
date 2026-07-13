"use client";

import * as React from "react";
import Link from "next/link";
import { GitCompareArrows, Scale } from "lucide-react";
import { MIN_COMPARE, useComparison } from "@/store/comparison";
import { ComparisonView } from "@/components/comparison/comparison-view";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import type { ComparisonResult, Property } from "@/lib/types";

export function CompareClient() {
  const selected = useComparison((s) => s.selected);
  const [hydrated, setHydrated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [similar, setSimilar] = React.useState<Property[]>([]);
  const [result, setResult] = React.useState<ComparisonResult | null>(null);

  // Selection lives in localStorage (zustand persist) — wait for hydration.
  React.useEffect(() => setHydrated(true), []);

  const key = selected.join(",");
  React.useEffect(() => {
    if (!hydrated) return;
    if (selected.length < MIN_COMPARE) {
      setProperties([]);
      setSimilar([]);
      setResult(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .compare(selected)
      .then((payload) => {
        if (cancelled) return;
        setProperties(payload.properties);
        setSimilar(payload.similar);
        // Reuse the server's scoring result — don't recompute on the client.
        setResult(payload.result);
      })
      .catch(() => {
        if (cancelled) return;
        setProperties([]);
        setSimilar([]);
        setResult(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, key]);

  if (!hydrated || loading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (properties.length < MIN_COMPARE) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Scale className="h-7 w-7 text-accent" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-primary dark:text-foreground">
          Pick at least {MIN_COMPARE} properties
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Head to the selection page and choose the homes you&apos;d like to
          compare.
        </p>
        <Link href="/properties" className="mt-6">
          <Button variant="accent" size="md">
            <GitCompareArrows className="h-4 w-4" /> Select properties
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <ComparisonView
      properties={properties}
      similar={similar}
      result={result ?? undefined}
    />
  );
}
