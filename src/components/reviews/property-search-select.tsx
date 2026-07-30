"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Loader2, MapPin, Search, X } from "lucide-react";
import { loadOptions } from "@/components/comparison/property-picker";
import { CoverImage } from "@/components/ui/cover-image";
import { getRecentPropertyIds } from "@/lib/recent-properties";
import { cn, formatPriceLakh } from "@/lib/utils";
import type { PropertyOption } from "@/lib/types";

const RECENT_SHOWN = 3;
const POPULAR_SHOWN = 5;
const MATCHES_SHOWN = 8;

/**
 * "Select a property to review" — a search box that opens a panel of shortcuts
 * (recently viewed, popular) and turns into a match list as soon as you type.
 *
 * Reuses `loadOptions()` from the comparison picker, so the slim catalogue is
 * fetched once per page even when both are mounted.
 */
export function PropertySearchSelect({
  value,
  onChange,
  popularIds,
}: {
  value: PropertyOption | null;
  onChange: (next: PropertyOption | null) => void;
  /** Most-reviewed property ids, from GET /api/reviews. */
  popularIds: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState<PropertyOption[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [recentIds, setRecentIds] = React.useState<string[]>([]);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // localStorage is client-only; read it after mount so SSR and the first
  // client render agree.
  React.useEffect(() => setRecentIds(getRecentPropertyIds()), []);

  React.useEffect(() => {
    let cancelled = false;
    loadOptions()
      .then((rows) => !cancelled && setOptions(rows))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const byId = React.useMemo(
    () => new Map((options ?? []).map((o) => [o.id, o])),
    [options],
  );

  const recent = React.useMemo(
    () =>
      recentIds
        .map((id) => byId.get(id))
        .filter((o): o is PropertyOption => Boolean(o))
        .slice(0, RECENT_SHOWN),
    [recentIds, byId],
  );

  // Popularity comes from real review counts. Before any reviews exist that
  // list is empty, so top up from the catalogue rather than showing a gap.
  const popular = React.useMemo(() => {
    const ranked = popularIds
      .map((id) => byId.get(id))
      .filter((o): o is PropertyOption => Boolean(o));
    const filler = (options ?? []).filter((o) => !ranked.some((r) => r.id === o.id));
    return [...ranked, ...filler].slice(0, POPULAR_SHOWN);
  }, [popularIds, byId, options]);

  const matches = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !options) return [];
    return options
      .filter((o) =>
        `${o.name} ${o.builderName} ${o.locality} ${o.city}`.toLowerCase().includes(q),
      )
      .slice(0, MATCHES_SHOWN);
  }, [query, options]);

  const pick = (o: PropertyOption) => {
    onChange(o);
    setQuery("");
    setOpen(false);
  };

  // A chosen property replaces the search box entirely — the answer to
  // "which property?" should be the thing on screen, not a hint inside a field.
  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/[0.06] p-2.5">
        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
          <CoverImage src={value.image} alt={value.name} gradient={value.gradient} sizes="48px" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-foreground">
            {value.builderName} {value.name}
          </span>
          <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 text-accent" />
            {value.locality}
            {value.city ? `, ${value.city}` : ""}
          </span>
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-danger"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapRef}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={query}
        onFocus={() => setOpen(true)}
        // Also on click: once the field already has focus, a second focus event
        // never fires, so clicking a closed panel would otherwise do nothing.
        onClick={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder="Search by property name, project or location..."
        aria-label="Search for a property to review"
        aria-expanded={open}
        role="combobox"
        aria-controls="review-property-panel"
        className="h-12 w-full rounded-xl border border-accent/60 bg-background pl-10 pr-10 text-sm outline-none ring-accent/30 placeholder:text-muted-foreground focus:ring-2"
      />
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          inputRef.current?.focus();
        }}
        aria-label={open ? "Close suggestions" : "Show suggestions"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id="review-property-panel"
          className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-border bg-card shadow-lift"
        >
          {failed ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              Couldn&apos;t load properties. Please refresh and try again.
            </p>
          ) : !options ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading properties…
            </div>
          ) : query.trim() ? (
            matches.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                No property matches “{query.trim()}”.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto p-2">
                {matches.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => pick(o)}
                      className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
                    >
                      <span className="relative h-11 w-14 shrink-0 overflow-hidden rounded-md">
                        <CoverImage src={o.image} alt={o.name} gradient={o.gradient} sizes="56px" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-foreground">
                          {o.builderName} {o.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {o.locality}
                          {o.city ? `, ${o.city}` : ""}
                        </span>
                      </span>
                      {o.priceLakh > 0 && (
                        <span className="shrink-0 text-xs font-bold text-accent">
                          {formatPriceLakh(o.priceLakh)}*
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="grid gap-0 sm:grid-cols-[1.35fr_1fr] sm:divide-x sm:divide-border">
              <div className="p-3">
                <p className="px-1 pb-2 text-xs font-bold text-foreground">
                  {recent.length > 0 ? "Recent Properties" : "Start with these"}
                </p>
                <ul>
                  {(recent.length > 0 ? recent : popular.slice(0, RECENT_SHOWN)).map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => pick(o)}
                        className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-muted"
                      >
                        <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md">
                          <CoverImage src={o.image} alt={o.name} gradient={o.gradient} sizes="64px" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-foreground">
                            {o.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {o.city || o.locality}
                          </span>
                          {o.priceLakh > 0 && (
                            <span className="block text-xs font-bold text-accent">
                              {formatPriceLakh(o.priceLakh)}*
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/properties"
                  className="mt-1 inline-block px-1.5 text-xs font-semibold text-accent hover:underline"
                >
                  View all properties
                </Link>
              </div>

              <div className="border-t border-border p-3 sm:border-t-0">
                <p className="px-1 pb-2 text-xs font-bold text-foreground">
                  Popular Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {popular.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => pick(o)}
                      className="max-w-full truncate rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent"
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {query.trim() && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="flex w-full items-center justify-center gap-1.5 border-t border-border py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              <X className="h-3 w-3" /> Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}
