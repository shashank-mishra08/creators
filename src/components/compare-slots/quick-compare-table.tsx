"use client";

import * as React from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  CalendarCheck,
  Check,
  ChevronDown,
  Dumbbell,
  Gauge,
  Home,
  LayoutPanelTop,
  MapPin,
  Maximize2,
  Ruler,
  Sparkles,
  Train,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { CoverImage } from "@/components/ui/cover-image";
import { cn, formatPriceLakh } from "@/lib/utils";
import type { ComparisonResult, Property } from "@/lib/types";

/** One line of the comparison table. */
interface Row {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Display text, or null when this property has no value for the row. */
  value: (p: Property) => string | null;
  /** Comparable number, or null to leave a property out of the ranking. */
  rank?: (p: Property) => number | null;
  /** Which end of `rank` is better. Omit for facts that don't rank. */
  better?: "higher" | "lower";
  /** Tooltip on the winning cell, e.g. "Lowest price per sq.ft". */
  betterLabel?: string;
}

const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

/**
 * Possession as a sortable month number, for ranking only.
 *
 * `possessionDate` is a display label ("Nov 2030", "Ready to Move · Dec 2026"),
 * so it is read rather than parsed as a date. Month precision matters: on year
 * alone, May 2030 and Nov 2030 tie and neither would be marked.
 */
function possessionRank(p: Property): number | null {
  const year = p.possessionDate.match(/(20\d{2})/);
  if (!year) return p.possession === "Ready to Move" ? 0 : null;
  const month = MONTHS.findIndex((m) => p.possessionDate.toLowerCase().includes(m));
  return Number(year[1]) * 12 + (month >= 0 ? month : 0);
}

function sizeRange(p: Property): string | null {
  const areas = p.floorPlans.map((f) => f.areaSqFt).filter((n) => n > 0);
  if (areas.length === 0) return null;
  const lo = Math.min(...areas);
  const hi = Math.max(...areas);
  const fmt = (n: number) => n.toLocaleString("en-IN");
  return lo === hi ? `${fmt(lo)} sq.ft` : `${fmt(lo)} – ${fmt(hi)} sq.ft`;
}

const availableCount = (p: Property) =>
  p.amenityList.filter((a) => a.available).length;

/** The seven headline rows, always visible. */
const CORE_ROWS: Row[] = [
  {
    key: "builder",
    label: "Developer",
    icon: Building2,
    value: (p) =>
      p.builder.rating > 0
        ? `${p.builder.name} · ${p.builder.rating.toFixed(1)}★`
        : p.builder.name || null,
    rank: (p) => (p.builder.rating > 0 ? p.builder.rating : null),
    better: "higher",
    betterLabel: "Highest builder rating",
  },
  { key: "kind", label: "Property Type", icon: Home, value: (p) => p.kind || null },
  {
    key: "configs",
    label: "Configuration",
    icon: LayoutPanelTop,
    value: (p) => p.configs || null,
  },
  {
    key: "area",
    label: "Total Area",
    icon: Maximize2,
    value: (p) => (p.areaAcres > 0 ? `${p.areaAcres} Acres` : null),
  },
  {
    key: "towers",
    label: "Towers",
    icon: Building2,
    value: (p) => (p.towers > 0 ? `${p.towers} Towers` : null),
  },
  {
    key: "units",
    label: "Total Units",
    icon: Users,
    value: (p) => (p.totalUnits ? `${p.totalUnits.toLocaleString("en-IN")} Units` : null),
  },
  {
    key: "possession",
    label: "Possession",
    icon: CalendarCheck,
    // The label often repeats the status ("Under Construction · Nov 2030").
    value: (p) => p.possessionDate.replace(/^.*· /, "") || p.possession || null,
    rank: possessionRank,
    better: "lower",
    betterLabel: "Earliest possession",
  },
];

/** Everything behind "View All Features". */
function extraRows(result: ComparisonResult | null): Row[] {
  const rows: Row[] = [];

  if (result) {
    rows.push({
      key: "score",
      label: "Match Score",
      icon: Trophy,
      value: (p) => `${Math.round(result.scores[p.id]?.overall ?? 0)}/100`,
      rank: (p) => result.scores[p.id]?.overall ?? null,
      better: "higher",
      betterLabel: "Highest overall score",
    });
  }

  rows.push(
    {
      key: "psf",
      label: "Price / sq.ft",
      icon: Ruler,
      value: (p) =>
        p.pricePerSqFt > 0 ? `₹${p.pricePerSqFt.toLocaleString("en-IN")}` : null,
      rank: (p) => (p.pricePerSqFt > 0 ? p.pricePerSqFt : null),
      better: "lower",
      betterLabel: "Lowest price per sq.ft",
    },
    { key: "segment", label: "Segment", icon: Sparkles, value: (p) => p.category || null },
    { key: "sizes", label: "Unit Sizes", icon: Maximize2, value: sizeRange },
    {
      key: "amenities",
      label: "Amenities Offered",
      icon: Dumbbell,
      value: (p) =>
        p.amenityList.length > 0
          ? `${availableCount(p)} of ${p.amenityList.length}`
          : null,
      rank: (p) => (p.amenityList.length > 0 ? availableCount(p) : null),
      better: "higher",
      betterLabel: "Most amenities offered",
    },
    {
      key: "metro",
      label: "Nearest Metro",
      icon: Train,
      value: (p) => (p.location.metroKm > 0 ? `${p.location.metroKm} min` : null),
      rank: (p) => (p.location.metroKm > 0 ? p.location.metroKm : null),
      better: "lower",
      betterLabel: "Closest to a metro station",
    },
    {
      key: "connectivity",
      label: "Connectivity",
      icon: Gauge,
      value: (p) =>
        p.location.connectivityIndex > 0 ? `${p.location.connectivityIndex}/100` : null,
      rank: (p) => (p.location.connectivityIndex > 0 ? p.location.connectivityIndex : null),
      better: "higher",
      betterLabel: "Best connectivity score",
    },
  );

  if (result) {
    rows.push({
      key: "bestfor",
      label: "Best For",
      icon: Users,
      value: (p) => result.scores[p.id]?.bestFor.join(", ") || null,
    });
  }

  rows.push({
    key: "rera",
    label: "RERA ID",
    icon: BadgeCheck,
    value: (p) => p.reraId || null,
  });

  return rows;
}

/**
 * The comparison itself: one column per chosen property, one row per fact.
 *
 * Where "better" is objective (cheaper, sooner, more amenities, higher score)
 * the winning cell is marked, with the reason in its tooltip — never an
 * unexplained opinion. A tie is left unmarked rather than picking arbitrarily.
 */
export function QuickCompareTable({
  properties,
  result,
  onRemove,
}: {
  properties: Property[];
  /** Null until at least two properties are chosen — a lone score is meaningless. */
  result: ComparisonResult | null;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const n = properties.length;

  const headRef = React.useRef<HTMLDivElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  /**
   * Keep the header strip and the rows in step horizontally.
   *
   * They are two separate scrollers on purpose (see the markup below), so the
   * only thing tying them together is this: whichever one the visitor scrolls,
   * the other follows. No lock flag is needed — the echoed scroll event finds
   * the values already equal and does nothing.
   */
  React.useEffect(() => {
    const head = headRef.current;
    const body = bodyRef.current;
    if (!head || !body) return;

    const follow = (from: HTMLElement, to: HTMLElement) => () => {
      if (Math.abs(to.scrollLeft - from.scrollLeft) > 0.5) to.scrollLeft = from.scrollLeft;
    };
    const headFollowsBody = follow(body, head);
    const bodyFollowsHead = follow(head, body);

    body.addEventListener("scroll", headFollowsBody, { passive: true });
    head.addEventListener("scroll", bodyFollowsHead, { passive: true });
    return () => {
      body.removeEventListener("scroll", headFollowsBody);
      head.removeEventListener("scroll", bodyFollowsHead);
    };
  }, []);

  const rows = React.useMemo(
    () => (expanded ? [...CORE_ROWS, ...extraRows(result)] : CORE_ROWS),
    [expanded, result],
  );

  // Winner per row, or nothing when fewer than two values or the best is a tie.
  const winners = React.useMemo(() => {
    const out = new Map<string, string>();
    for (const row of rows) {
      if (!row.rank || !row.better) continue;
      const scored = properties
        .map((p) => ({ id: p.id, v: row.rank!(p) }))
        .filter((x): x is { id: string; v: number } => x.v != null);
      if (scored.length < 2) continue;
      const best =
        row.better === "higher"
          ? Math.max(...scored.map((s) => s.v))
          : Math.min(...scored.map((s) => s.v));
      const atBest = scored.filter((s) => s.v === best);
      if (atBest.length === 1) out.set(row.key, atBest[0].id);
    }
    return out;
  }, [rows, properties]);

  const visibleRows = rows.filter((r) => properties.some((p) => r.value(p) != null));

  // Amenity union, so the matrix covers every amenity any of them offers.
  const amenityUnion = React.useMemo(() => {
    if (!expanded) return [];
    const map = new Map<string, string>();
    properties.forEach((p) =>
      p.amenityList.forEach((a) => {
        if (!map.has(a.key)) map.set(a.key, a.label);
      }),
    );
    return [...map.entries()]
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [expanded, properties]);

  const hasAmenity = (p: Property, key: string) =>
    p.amenityList.some((a) => a.key === key && a.available);

  const grid: React.CSSProperties = {
    gridTemplateColumns: `minmax(140px, 190px) repeat(${n}, minmax(0, 1fr))`,
    minWidth: `${190 + n * 190}px`,
  };

  return (
    // No `overflow-hidden` on the card: it would make the card a scroll
    // container, and the sticky header below would then stick to the card
    // instead of the viewport. The header strip rounds its own top corners.
    <div className="rounded-2xl border border-border bg-card shadow-glass">
      {/*
        The header is its own scroller, sitting outside the one that holds the
        rows, so that it can be `sticky` against the *page*.

        It cannot live inside the rows' container: `overflow-x: auto` there
        makes that element the scrollport for the vertical axis too (per spec an
        `overflow-y: visible` sibling computes to `auto`), so a `sticky top-…`
        header inside it is measured against a box that never scrolls and drifts
        away with the page. Capping that container's height fixes the sticking
        but costs the page its scroll — the table then scrolls inside a window
        of its own instead of running down to the footer. Two scrollers kept in
        sync (see the effect above) give both: page scroll all the way down, and
        a header that stays put.

        `top-16` clears the site header, which is `sticky top-0 h-16`.
      */}
      <div
        ref={headRef}
        className="no-scrollbar sticky top-16 z-20 overflow-x-auto rounded-t-2xl border-b border-border bg-card"
      >
        <div style={grid} className="grid">
          <div className="sticky left-0 z-[1] flex items-center bg-card px-4 py-4">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              Overview
            </span>
          </div>

          {properties.map((p) => {
            const isTop = result?.ranking[0] === p.id;
            return (
              <div
                key={p.id}
                className={cn(
                  "border-l border-border p-3.5",
                  isTop && "bg-accent/[0.05]",
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg">
                    <CoverImage src={p.image} alt={p.name} gradient={p.gradient} sizes="80px" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-1">
                      <Link
                        href={`/properties/${p.id}`}
                        className="min-w-0 flex-1 text-sm font-bold leading-tight text-foreground hover:text-accent"
                      >
                        {p.name}
                      </Link>
                      <button
                        onClick={() => onRemove(p.id)}
                        aria-label={`Remove ${p.name}`}
                        className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0 text-accent" />
                      {p.locality}
                      {p.city ? `, ${p.city}` : ""}
                    </div>
                    {p.priceLakh > 0 && (
                      <div className="mt-1.5 font-display text-base font-extrabold text-accent">
                        {formatPriceLakh(p.priceLakh)}
                        <span className="text-[10px] font-medium text-muted-foreground">*</span>
                      </div>
                    )}
                    {isTop && (
                      <span className="mt-1 inline-block rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent-foreground">
                        ★ Top pick
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rows. Same column template and the same container width as the header
          strip, so the two grids resolve to identical column widths. */}
      <div ref={bodyRef} className="overflow-x-auto">
        <div style={grid} className="grid">
          {visibleRows.map((row) => {
            const Icon = row.icon;
            const winner = winners.get(row.key);
            return (
              <React.Fragment key={row.key}>
                <div className="sticky left-0 z-[2] flex items-center gap-2.5 border-t border-border bg-card px-4 py-3">
                  <Icon className="h-4 w-4 shrink-0 text-accent" />
                  <span className="text-sm font-semibold text-foreground">{row.label}</span>
                </div>
                {properties.map((p) => {
                  const text = row.value(p);
                  const isWinner = winner === p.id;
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center gap-2 border-l border-t border-border px-4 py-3",
                        result?.ranking[0] === p.id && "bg-accent/[0.05]",
                      )}
                    >
                      <span
                        className={cn(
                          "break-words text-sm",
                          text == null
                            ? "text-muted-foreground/60"
                            : isWinner
                              ? "font-bold text-accent"
                              : "text-foreground",
                          row.key === "rera" && "break-all text-xs",
                        )}
                      >
                        {text ?? "—"}
                      </span>
                      {isWinner && (
                        <span
                          title={row.betterLabel}
                          className="shrink-0 rounded-full bg-success/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-success"
                        >
                          Best
                        </span>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* ── amenity matrix, only once expanded ─────────────────────── */}
          {amenityUnion.length > 0 && (
            <>
              <div className="sticky left-0 z-[2] col-span-1 border-t-2 border-border bg-card px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  Amenities
                </span>
              </div>
              {properties.map((p) => (
                <div key={p.id} className="border-l border-t-2 border-border" />
              ))}

              {amenityUnion.map((a) => (
                <React.Fragment key={a.key}>
                  <div className="sticky left-0 z-[2] flex items-center border-t border-border bg-card px-4 py-2.5">
                    <span className="text-sm text-foreground">{a.label}</span>
                  </div>
                  {properties.map((p) => (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center justify-center border-l border-t border-border px-4 py-2.5",
                        result?.ranking[0] === p.id && "bg-accent/[0.05]",
                      )}
                    >
                      {hasAmenity(p, a.key) ? (
                        <Check className="h-5 w-5 rounded-full bg-success/15 p-0.5 text-success" />
                      ) : (
                        <X className="h-5 w-5 rounded-full bg-danger/10 p-0.5 text-danger/60" />
                      )}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      </div>

      {/* No link across to /compare from here: that page reads the shared
          selection store, which this route deliberately never writes to, so the
          link would open a comparison of entirely different properties. */}
      <div className="flex items-center justify-center border-t border-border p-4">
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-accent transition-colors hover:bg-accent/10"
        >
          {expanded ? "Hide extra features" : "View All Features"}
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
        </button>
      </div>
    </div>
  );
}
