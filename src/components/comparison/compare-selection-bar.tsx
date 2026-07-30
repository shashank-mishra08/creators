"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Loader2, Plus, Scale, Search, X } from "lucide-react";
import { MAX_COMPARE, useComparison } from "@/store/comparison";
import { loadOptions, PropertyPicker } from "@/components/comparison/property-picker";
import { CoverImage } from "@/components/ui/cover-image";
import { cn, formatPriceLakh } from "@/lib/utils";
import type { Property, PropertyOption } from "@/lib/types";

/**
 * The comparison set, managed from a bar across the top of the page.
 *
 * Replaces the sidebar card: that was desktop-only and easy to miss, and its
 * dropdown had nowhere to open into. Here the whole set is visible at a glance
 * and one panel handles everything — type to search, swap a column, drop one,
 * or add another.
 */
export function CompareSelectionBar({ properties }: { properties: Property[] }) {
  const remove = useComparison((s) => s.remove);
  const toggle = useComparison((s) => s.toggle);
  const selected = useComparison((s) => s.selected);

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState<PropertyOption[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const barRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [anchor, setAnchor] = React.useState({ top: 0, left: 0, width: 0 });

  React.useEffect(() => setMounted(true), []);

  // The panel is portalled to <body> to escape any stacking context on the way
  // up, so its position has to be measured from the bar rather than inherited.
  const place = React.useCallback(() => {
    const el = barRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchor({ top: r.bottom + 8, left: r.left, width: r.width });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    place();
    searchRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || barRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, place]);

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

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const n = properties.length;
  const full = n >= MAX_COMPARE;

  const addable = React.useMemo(() => {
    if (!options) return [];
    const q = query.trim().toLowerCase();
    return options
      .filter((o) => !selected.includes(o.id))
      .filter((o) =>
        !q
          ? true
          : `${o.name} ${o.builderName} ${o.locality} ${o.city}`
              .toLowerCase()
              .includes(q),
      );
  }, [options, query, selected]);

  const panel = (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Manage comparison"
      style={{ top: anchor.top, left: anchor.left, width: anchor.width }}
      className="fixed z-[90] max-h-[70vh] overflow-hidden rounded-2xl border border-border bg-card shadow-lift"
    >
      <div className="relative border-b border-border p-3">
        <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search a project, builder or location"
          aria-label="Search properties"
          className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none ring-accent/40 focus:ring-2"
        />
      </div>

      <div className="max-h-[calc(70vh-4.5rem)] overflow-y-auto">
        {/* Already in the comparison */}
        <div className="p-2">
          <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            In this comparison ({n}/{MAX_COMPARE})
          </p>
          {properties.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-muted"
            >
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                <CoverImage src={p.image} alt={p.name} gradient={p.gradient} sizes="40px" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-foreground">
                  {p.builder.name} {p.name}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {p.locality}
                  {p.priceLakh > 0 && ` · ${formatPriceLakh(p.priceLakh)}`}
                </span>
              </span>

              <PropertyPicker
                mode="swap"
                currentId={p.id}
                onDone={() => setOpen(false)}
                trigger={({ toggle: openPicker }) => (
                  <button
                    onClick={openPicker}
                    className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-background hover:text-accent"
                  >
                    Change
                  </button>
                )}
              />
              <button
                onClick={() => remove(p.id)}
                aria-label={`Remove ${p.name}`}
                className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Everything else, to add */}
        <div className="border-t border-border p-2">
          <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            {full ? `Remove one to add another` : "Add another"}
          </p>

          {failed ? (
            <p className="px-2 py-5 text-center text-xs text-muted-foreground">
              Couldn&apos;t load properties.{" "}
              <button
                onClick={() => setFailed(false)}
                className="font-semibold text-accent hover:underline"
              >
                Retry
              </button>
            </p>
          ) : !options ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </div>
          ) : addable.length === 0 ? (
            <p className="px-2 py-5 text-center text-xs text-muted-foreground">
              {query ? `No properties match “${query}”.` : "Nothing left to add."}
            </p>
          ) : (
            addable.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  if (full) return;
                  toggle(o.id);
                  setOpen(false);
                }}
                disabled={full}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors",
                  full ? "cursor-not-allowed opacity-45" : "hover:bg-muted",
                )}
              >
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                  <CoverImage src={o.image} alt={o.name} gradient={o.gradient} sizes="40px" />
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
                <Plus className="h-4 w-4 shrink-0 text-accent" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="border-b border-border bg-card">
      <div className="container py-3 lg:px-10">
        {/* Wraps on narrow screens: the label and Manage share the first row and
            the chips get a full-width second row. Kept on one line from `sm` up.
            Without this the chip strip was squeezed to ~50px on a phone and its
            remove buttons were unreachable. */}
        <div
          ref={barRef}
          className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-border bg-background px-3 py-2.5"
        >
          <Scale className="h-4 w-4 shrink-0 text-accent" />
          <span className="flex-1 shrink-0 text-sm font-bold text-foreground sm:flex-none">
            Comparing{" "}
            <span className="text-muted-foreground">
              {n} of {MAX_COMPARE}
            </span>
          </span>

          {/* Thumbnails of the current set, so the bar states the answer even
              before the panel is opened. Each carries its own remove button —
              dropping a property shouldn't require opening the panel first. */}
          <div className="order-last flex w-full min-w-0 items-center gap-1.5 overflow-x-auto no-scrollbar sm:order-none sm:w-auto sm:flex-1">
            {properties.map((p) => (
              <span
                key={p.id}
                title={`${p.builder.name} ${p.name}`}
                className="group/chip flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-1 pr-1"
              >
                <span className="relative h-6 w-6 overflow-hidden rounded-full">
                  <CoverImage src={p.image} alt="" gradient={p.gradient} sizes="24px" />
                </span>
                <span className="max-w-[9rem] truncate text-xs font-semibold text-foreground">
                  {p.name}
                </span>
                <button
                  onClick={() => remove(p.id)}
                  aria-label={`Remove ${p.name} from the comparison`}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>

          <button
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="dialog"
            aria-expanded={open}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-accent bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/15"
          >
            Manage
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
          </button>
        </div>
      </div>

      {open && mounted && createPortal(panel, document.body)}
    </div>
  );
}
