"use client";

import * as React from "react";
import { Check, ChevronDown, Loader2, MapPin, Search, X } from "lucide-react";
import { CoverImage } from "@/components/ui/cover-image";
import { cn, formatPriceLakh } from "@/lib/utils";
import type { PropertyOption } from "@/lib/types";

/**
 * One "COMPARE WITH" slot: a dropdown that either invites a choice or shows the
 * property currently in this column.
 *
 * Deliberately independent of `@/components/comparison/property-picker` and of
 * the shared comparison store. That picker is a modal wired straight into the
 * store that drives the header badge, the listing tray and /compare — reusing it
 * here would mean choosing a property on this page silently rewrote all three.
 */
export function PropertySlotSelect({
  value,
  options,
  loading,
  failed,
  disabledIds,
  onSelect,
  onClear,
  onRetry,
  slotLabel,
}: {
  value: PropertyOption | null;
  options: PropertyOption[];
  loading: boolean;
  failed: boolean;
  /** Already chosen in another slot — shown, but not selectable twice. */
  disabledIds: string[];
  onSelect: (option: PropertyOption) => void;
  onClear: () => void;
  onRetry: () => void;
  /** Accessible name, e.g. "Property 1". */
  slotLabel: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    searchRef.current?.focus();
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

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      `${o.name} ${o.builderName} ${o.locality} ${o.city}`.toLowerCase().includes(q),
    );
  }, [options, query]);

  return (
    <div className="relative" ref={wrapRef}>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Compare with
      </p>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={value ? `${slotLabel}: ${value.name}. Change` : `${slotLabel}: select a property`}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border bg-background px-4 py-3 text-left transition-colors",
          value
            ? "border-accent/50 hover:border-accent"
            : "border-border hover:border-accent",
        )}
      >
        {value ? (
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="relative h-8 w-10 shrink-0 overflow-hidden rounded-md">
              <CoverImage src={value.image} alt="" gradient={value.gradient} sizes="40px" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-foreground">
                {value.name}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {value.builderName}
              </span>
            </span>
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Select a property</span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {value && (
        <button
          type="button"
          onClick={onClear}
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-danger"
        >
          <X className="h-3 w-3" /> Clear this slot
        </button>
      )}

      {open && (
        <div
          role="listbox"
          aria-label={`Choose a property for ${slotLabel}`}
          className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-border bg-card shadow-lift"
        >
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search project, builder or location"
              aria-label="Search properties"
              className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs outline-none ring-accent/40 focus:ring-2"
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5">
            {failed ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                Couldn&apos;t load properties.{" "}
                <button
                  type="button"
                  onClick={onRetry}
                  className="font-semibold text-accent hover:underline"
                >
                  Retry
                </button>
              </p>
            ) : loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
              </div>
            ) : results.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                No property matches “{query.trim()}”.
              </p>
            ) : (
              results.map((o) => {
                const isThisSlot = value?.id === o.id;
                // In another slot already: shown so the list stays complete, but
                // picking it would duplicate a column.
                const takenElsewhere = !isThisSlot && disabledIds.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="option"
                    aria-selected={isThisSlot}
                    disabled={takenElsewhere}
                    onClick={() => {
                      onSelect(o);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors",
                      takenElsewhere
                        ? "cursor-not-allowed opacity-45"
                        : "hover:bg-muted",
                      isThisSlot && "bg-accent/10",
                    )}
                  >
                    <span className="relative h-10 w-12 shrink-0 overflow-hidden rounded-md">
                      <CoverImage src={o.image} alt="" gradient={o.gradient} sizes="48px" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-foreground">
                        {o.builderName} {o.name}
                      </span>
                      <span className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0 text-accent" />
                        {o.locality}
                        {o.city ? `, ${o.city}` : ""}
                      </span>
                    </span>
                    {o.priceLakh > 0 && (
                      <span className="shrink-0 text-[11px] font-bold text-accent">
                        {formatPriceLakh(o.priceLakh)}*
                      </span>
                    )}
                    {isThisSlot && <Check className="h-4 w-4 shrink-0 text-accent" />}
                    {takenElsewhere && (
                      <span className="shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">
                        Added
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
