"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Scale } from "lucide-react";
import { PropertySlotSelect } from "@/components/compare-slots/property-slot-select";
import { QuickCompareTable } from "@/components/compare-slots/quick-compare-table";
import { api } from "@/lib/api/client";
import { compareProperties } from "@/lib/scoring";
import type { ComparisonResult, Property, PropertyOption } from "@/lib/types";

/** This route's own limit. Deliberately not the shared MAX_COMPARE (4), which
 *  belongs to /compare — changing that constant would alter the other page. */
const SLOTS = 3;

/**
 * Catalogue cache for this route only.
 *
 * The comparison picker has its own equivalent, but importing it would pull in
 * the shared selection store with it. This page must not touch that store, so it
 * keeps a tiny cache of its own — the request is the same 8.7 KB slim list.
 */
let optionsCache: PropertyOption[] | null = null;
let optionsInFlight: Promise<PropertyOption[]> | null = null;

function loadCatalogue(force = false): Promise<PropertyOption[]> {
  if (force) {
    optionsCache = null;
    optionsInFlight = null;
  }
  if (optionsCache) return Promise.resolve(optionsCache);
  if (!optionsInFlight) {
    optionsInFlight = api
      .propertyOptions()
      .then((rows) => {
        optionsCache = rows;
        return rows;
      })
      .finally(() => {
        optionsInFlight = null;
      });
  }
  return optionsInFlight;
}

/**
 * Slot-based property comparison: three dropdowns, pick any project in each,
 * and the comparison builds itself.
 *
 * Independent of /compare by design. The selection lives in this component and
 * in the URL (`?p=id,id,id`) — never in the shared `useComparison` store, which
 * twelve other files read (the header badge, the listing tray, /compare itself).
 * Writing there would mean choosing a property here silently rewrote all of them.
 */
export function QuickCompareClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [options, setOptions] = React.useState<PropertyOption[]>(optionsCache ?? []);
  const [loadingOptions, setLoadingOptions] = React.useState(!optionsCache);
  const [optionsFailed, setOptionsFailed] = React.useState(false);

  const [properties, setProperties] = React.useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Chosen ids, packed left. The URL is the single source of truth so a refresh
  // or a shared link rebuilds the same comparison.
  const ids = React.useMemo(() => {
    const raw = searchParams.get("p");
    if (!raw) return [];
    return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))].slice(
      0,
      SLOTS,
    );
  }, [searchParams]);

  const setIds = React.useCallback(
    (next: string[]) => {
      const clean = [...new Set(next.filter(Boolean))].slice(0, SLOTS);
      router.replace(
        clean.length > 0 ? `/compare/quick?p=${clean.join(",")}` : "/compare/quick",
        { scroll: false },
      );
    },
    [router],
  );

  const fetchCatalogue = React.useCallback((force = false) => {
    setOptionsFailed(false);
    setLoadingOptions(true);
    loadCatalogue(force)
      .then(setOptions)
      .catch(() => setOptionsFailed(true))
      .finally(() => setLoadingOptions(false));
  }, []);

  React.useEffect(() => {
    fetchCatalogue();
  }, [fetchCatalogue]);

  // Resolve the chosen ids to full properties. `propertiesByIds` accepts any
  // count and returns them in the order asked for, so columns follow slot order.
  const key = ids.join(",");
  React.useEffect(() => {
    if (ids.length === 0) {
      setProperties([]);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setLoadingProperties(true);
    setLoadError(null);
    api
      .propertiesByIds(ids)
      .then((rows) => {
        if (cancelled) return;
        setProperties(rows);
        // An id in the URL that no longer resolves (unpublished, or edited by
        // hand) is dropped rather than leaving a phantom column.
        if (rows.length !== ids.length) {
          setIds(rows.map((r) => r.id));
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load the selected properties.");
      })
      .finally(() => {
        if (!cancelled) setLoadingProperties(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const byId = React.useMemo(
    () => new Map(options.map((o) => [o.id, o])),
    [options],
  );

  /**
   * Scores only make sense across a set: `normHigh`/`normLow` collapse to 100
   * when min equals max, so a single property would score a meaningless 100/100.
   */
  const result: ComparisonResult | null = React.useMemo(
    () => (properties.length >= 2 ? compareProperties(properties) : null),
    [properties],
  );

  const chooseInSlot = (slot: number, option: PropertyOption) => {
    const next = [...ids];
    if (slot < next.length) next[slot] = option.id;
    else next.push(option.id);
    setIds(next);
  };

  const clearSlot = (slot: number) => setIds(ids.filter((_, i) => i !== slot));
  const removeById = (id: string) => setIds(ids.filter((x) => x !== id));

  return (
    <div className="bg-muted/30 pb-12">
      <div className="container pt-8 text-center lg:px-10">
        <h1 className="inline-flex items-center gap-2.5 font-display text-2xl font-extrabold tracking-tight text-primary dark:text-foreground sm:text-3xl">
          <Scale className="h-7 w-7 text-accent" />
          Compare Properties
        </h1>
        <p className="mx-auto mt-1.5 max-w-xl text-sm text-muted-foreground">
          Select up to {SLOTS} properties to compare features, prices, amenities
          and more.
        </p>
      </div>

      {/* Slots. Always all three, so the page reads the same before and after a
          choice — the dropdown either invites one or shows what is in it. */}
      <div className="container mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-10">
        {Array.from({ length: SLOTS }, (_, slot) => (
          <PropertySlotSelect
            key={slot}
            slotLabel={`Property ${slot + 1}`}
            value={ids[slot] ? byId.get(ids[slot]) ?? null : null}
            options={options}
            loading={loadingOptions}
            failed={optionsFailed}
            disabledIds={ids}
            onSelect={(option) => chooseInSlot(slot, option)}
            onClear={() => clearSlot(slot)}
            onRetry={() => fetchCatalogue(true)}
          />
        ))}
      </div>

      <div className="container mt-6 lg:px-10">
        {loadError ? (
          <div className="rounded-2xl border border-danger/30 bg-danger/5 p-10 text-center">
            <p className="text-sm font-semibold text-danger">{loadError}</p>
          </div>
        ) : ids.length === 0 ? (
          <EmptyState />
        ) : properties.length === 0 && loadingProperties ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-20 text-sm text-muted-foreground shadow-glass">
            <Loader2 className="h-4 w-4 animate-spin" /> Building your comparison…
          </div>
        ) : (
          <>
            <QuickCompareTable
              properties={properties}
              result={result}
              onRemove={removeById}
            />
            {properties.length === 1 && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                Pick one more property to see them side by side.
              </p>
            )}
          </>
        )}
      </div>

      <div className="container mt-4 lg:px-10">
        <div className="flex items-start gap-3.5 rounded-2xl border border-accent/25 bg-accent/[0.07] p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card">
            <Scale className="h-5 w-5 text-accent" />
          </span>
          <div>
            <h2 className="font-display text-sm font-bold text-primary dark:text-foreground">
              Compare and Decide Better
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Side-by-side comparison helps you choose the perfect property that
              fits your needs and budget. Cells marked{" "}
              <span className="font-bold text-success">Best</span> are the
              objectively stronger value in that row — hover one to see why.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 py-20 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
        <Scale className="h-6 w-6 text-accent" />
      </span>
      <p className="mt-4 font-display text-lg font-bold text-primary dark:text-foreground">
        Choose properties to compare
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Open any dropdown above and pick a project. Add a second one and the
        comparison appears here.
      </p>
    </div>
  );
}
