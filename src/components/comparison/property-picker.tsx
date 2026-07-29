"use client";

import * as React from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { useComparison } from "@/store/comparison";
import { CoverImage } from "@/components/ui/cover-image";
import { cn, formatPriceLakh } from "@/lib/utils";
import type { PropertyOption } from "@/lib/types";

/**
 * Catalogue cache shared by every picker instance on the page. The compare view
 * renders one picker per column plus an "add" picker; without this, opening each
 * one would refetch the same list. Module scope (not state) so the fetch is
 * shared even across separately mounted pickers.
 */
let optionsCache: PropertyOption[] | null = null;
let optionsInFlight: Promise<PropertyOption[]> | null = null;

function loadOptions(): Promise<PropertyOption[]> {
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
 * Searchable property chooser for the comparison page.
 *
 * `mode="swap"` replaces `currentId` in place (column keeps its position);
 * `mode="add"` appends a new property. Either way it mutates the comparison
 * store, and `CompareClient` re-fetches off the selection — so the user never
 * leaves the page to change what they're comparing.
 */
export function PropertyPicker({
  mode,
  currentId,
  trigger,
  align = "left",
  onDone,
}: {
  mode: "swap" | "add";
  currentId?: string;
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  align?: "left" | "right";
  onDone?: () => void;
}) {
  const selected = useComparison((s) => s.selected);
  const toggleSelection = useComparison((s) => s.toggle);
  const replace = useComparison((s) => s.replace);

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState<PropertyOption[] | null>(
    optionsCache,
  );
  const [failed, setFailed] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Fetch lazily — the catalogue is only needed once a picker is actually opened.
  React.useEffect(() => {
    if (!open || options) return;
    let cancelled = false;
    setFailed(false);
    loadOptions()
      .then((rows) => !cancelled && setOptions(rows))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [open, options]);

  // Close on outside click / ESC; focus the search box on open.
  React.useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
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
    if (!open) setQuery("");
  }, [open]);

  const results = React.useMemo(() => {
    if (!options) return [];
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      `${o.name} ${o.builderName} ${o.locality} ${o.city}`
        .toLowerCase()
        .includes(q),
    );
  }, [options, query]);

  function choose(option: PropertyOption) {
    // Selecting the one already in this column is a no-op, not a removal.
    if (mode === "swap" && currentId) {
      if (option.id !== currentId) replace(currentId, option.id);
    } else if (!selected.includes(option.id)) {
      toggleSelection(option.id);
    }
    setOpen(false);
    onDone?.();
  }

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}

      {open && (
        <div
          role="dialog"
          aria-label={mode === "swap" ? "Change property" : "Add property"}
          className={cn(
            "absolute top-full z-40 mt-2 w-[19rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-lift",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search project, builder or location"
              aria-label="Search properties"
              className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-8 text-xs outline-none ring-accent/40 focus:ring-2"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5">
            {failed ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                Couldn&apos;t load properties.{" "}
                <button
                  type="button"
                  onClick={() => setFailed(false)}
                  className="font-semibold text-accent hover:underline"
                >
                  Retry
                </button>
              </p>
            ) : !options ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
              </div>
            ) : results.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                No properties match &ldquo;{query}&rdquo;.
              </p>
            ) : (
              results.map((o) => {
                const isCurrent = o.id === currentId;
                // Comparing it in another column — offering it here would just
                // produce a duplicate, so show it as taken.
                const takenElsewhere = !isCurrent && selected.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => !takenElsewhere && choose(o)}
                    disabled={takenElsewhere}
                    aria-current={isCurrent || undefined}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors",
                      takenElsewhere
                        ? "cursor-not-allowed opacity-45"
                        : "hover:bg-muted",
                      isCurrent && "bg-accent/10",
                    )}
                  >
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                      <CoverImage
                        src={o.image}
                        alt={o.name}
                        gradient={o.gradient}
                        sizes="40px"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-foreground">
                        {o.builderName} {o.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {o.locality}
                        {o.priceLakh > 0 && ` · ${formatPriceLakh(o.priceLakh)}`}
                      </span>
                    </span>
                    {isCurrent ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                    ) : takenElsewhere ? (
                      <span className="shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">
                        Added
                      </span>
                    ) : null}
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
