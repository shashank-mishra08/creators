"use client";

import * as React from "react";
import { Check, ChevronDown, LocateFixed, MapPin, Search } from "lucide-react";
import { NEARBY_RADIUS_KM, formatKm, nearestCity } from "@/lib/geo";
import type { City } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Toggle a value in a set without mutating it. */
const toggle = <T,>(set: Set<T>, v: T) => {
  const n = new Set(set);
  n.has(v) ? n.delete(v) : n.add(v);
  return n;
};


/**
 * Location picker that lives on the end of the search bar.
 *
 * Two ways in: type to filter the cities we actually operate in, or hand over
 * the browser's position and let it pick the nearest one. Geolocation is
 * compared against real project coordinates where we have them and city
 * centroids where we don't — see `@/lib/geo`. Nothing is geocoded remotely, so
 * there is no API key and no request leaves the page.
 *
 * Selecting writes to the same `locations` set the sidebar Location group uses,
 * so the two controls can never disagree.
 */
export function LocationPickerButton({
  cities,
  selected,
  onApply,
  count,
  className,
  panelClassName,
}: {
  cities: City[];
  selected: Set<City>;
  onApply: (next: Set<City>) => void;
  count: (city: City) => number;
  /** Overrides the pill's own sizing (the navbar needs a shorter one). */
  className?: string;
  /** Overrides where the panel opens from (the navbar's sits at the right). */
  panelClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [locating, setLocating] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setNotice(null);
    }
  }, [open]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.toLowerCase().includes(q));
  }, [cities, query]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setNotice("Your browser can't share a location.");
      return;
    }
    setLocating(true);
    setNotice(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const nearest = nearestCity(origin);

        if (!nearest) {
          setNotice("Oops — sorry, no property found near your location.");
          return;
        }

        // Outside every market we cover: say so plainly, and leave the full
        // list showing rather than filtering to somewhere far away.
        if (nearest.km > NEARBY_RADIUS_KM) {
          onApply(new Set());
          setNotice(
            `Oops — sorry, no property found near your location. Showing everything instead (closest is ${nearest.city}, ${formatKm(nearest.km)} away).`,
          );
          return;
        }

        onApply(new Set([nearest.city]));
        setOpen(false);
      },
      () => {
        setLocating(false);
        setNotice("Couldn't get your location. Pick a city instead.");
      },
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }

  const active = selected.size > 0;

  return (
    <div ref={ref} className="relative">
      {/* The selected city replaces the label, so the pill states the filter
          rather than making you open it to find out. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Filter by location"
        className={cn(
          "inline-flex h-12 w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-sm font-semibold transition-colors sm:w-auto sm:max-w-[14rem] sm:justify-start",
          active
            ? "border-accent bg-accent/10 text-accent"
            : "border-border bg-card text-foreground hover:bg-muted",
          className,
        )}
      >
        <MapPin className={cn("h-4 w-4 shrink-0", !active && "text-accent")} />
        <span className="truncate">
          {selected.size === 0
            ? "Choose Location"
            : selected.size === 1
              ? [...selected][0]
              : `${selected.size} locations`}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a location"
          // Opens from the pill's left edge: the pill sits at the start of the
          // toolbar now, and a right-aligned panel would extend past it into
          // the filter sidebar.
          className={cn(
            "absolute left-0 top-full z-40 mt-2 w-[20rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-lift",
            panelClassName,
          )}
        >
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your location"
                aria-label="Enter your location"
                className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs outline-none ring-accent/40 focus:ring-2"
              />
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/15 disabled:opacity-60"
            >
              <LocateFixed className={cn("h-3.5 w-3.5", locating && "animate-spin")} />
              {locating ? "Locating…" : "Use my current location"}
            </button>
          </div>

          {notice && (
            <p className="border-b border-border bg-muted/50 px-3 py-2.5 text-[11px] leading-snug text-muted-foreground">
              {notice}
            </p>
          )}

          <div className="max-h-60 overflow-y-auto p-1.5">
            {results.length === 0 ? (
              // Two different nothings. Typing into the filter and matching no
              // city is a search miss; an empty `cities` list is the catalogue
              // being empty. Neither is "nothing near you" — that answer comes
              // from the geolocation path, which writes its own `notice` above.
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                {query.trim()
                  ? `No location matches “${query.trim()}”.`
                  : "No locations to choose from yet."}
              </p>
            ) : (
              results.map((c) => {
                const checked = selected.has(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onApply(toggle(selected, c))}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                        checked
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border",
                      )}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="flex-1 truncate text-foreground">{c}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {count(c)}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {active && (
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={() => onApply(new Set())}
                className="w-full rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Clear locations
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
