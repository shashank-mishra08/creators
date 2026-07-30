"use client";

import * as React from "react";
import {
  BadgeCheck,
  Building2,
  CalendarCheck,
  ChevronDown,
  Dumbbell,
  Gauge,
  Home,
  IndianRupee,
  Layers,
  LayoutPanelTop,
  Maximize2,
  Plus,
  Ruler,
  Sparkles,
  Train,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { MAX_COMPARE, useComparison } from "@/store/comparison";
import { PropertyPicker } from "@/components/comparison/property-picker";
import { CoverImage } from "@/components/ui/cover-image";
import { cn, formatPriceLakh } from "@/lib/utils";
import type { ComparisonResult, Property } from "@/lib/types";

/** One line of the summary table. */
interface Row {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Display text, or null when this property has no value for the row. */
  value: (p: Property) => string | null;
  /** Comparable number, or null to leave a property out of the ranking. */
  rank?: (p: Property) => number | null;
  /** Which end of `rank` is the better one. Omit for facts that don't rank. */
  better?: "higher" | "lower";
  /** Tooltip on the winning cell, e.g. "Lowest starting price". */
  betterLabel?: string;
}

/** Min–max unit size across a project's floor plans. */
function sizeRange(p: Property): string | null {
  const areas = p.floorPlans.map((f) => f.areaSqFt).filter((n) => n > 0);
  if (areas.length === 0) return null;
  const lo = Math.min(...areas);
  const hi = Math.max(...areas);
  const fmt = (n: number) => n.toLocaleString("en-IN");
  return lo === hi ? `${fmt(lo)} sq.ft` : `${fmt(lo)} – ${fmt(hi)} sq.ft`;
}

function amenityCount(p: Property): number {
  return p.amenityList.filter((a) => a.available).length;
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
 * alone, May 2030 and Nov 2030 tie and neither gets marked. A label with no
 * year doesn't rank at all.
 */
function possessionRank(p: Property): number | null {
  const year = p.possessionDate.match(/(20\d{2})/);
  if (!year) return p.possession === "Ready to Move" ? 0 : null;
  const month = MONTHS.findIndex((m) =>
    p.possessionDate.toLowerCase().includes(m),
  );
  return Number(year[1]) * 12 + (month >= 0 ? month : 0);
}

function buildRows(result: ComparisonResult): Row[] {
  return [
    {
      key: "score",
      label: "Match score",
      icon: Trophy,
      value: (p) => `${Math.round(result.scores[p.id]?.overall ?? 0)}/100`,
      rank: (p) => result.scores[p.id]?.overall ?? null,
      better: "higher",
      betterLabel: "Highest overall score",
    },
    {
      key: "price",
      label: "Starting price",
      icon: IndianRupee,
      value: (p) => (p.priceLakh > 0 ? `${formatPriceLakh(p.priceLakh)}*` : null),
      rank: (p) => (p.priceLakh > 0 ? p.priceLakh : null),
      better: "lower",
      betterLabel: "Lowest starting price",
    },
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
    {
      key: "segment",
      label: "Segment",
      icon: Sparkles,
      value: (p) => p.category || null,
    },
    {
      key: "kind",
      label: "Property type",
      icon: Home,
      value: (p) => p.kind || null,
    },
    {
      key: "configs",
      label: "Configurations",
      icon: LayoutPanelTop,
      value: (p) => p.configs || null,
    },
    {
      key: "sizes",
      label: "Unit sizes",
      icon: Maximize2,
      value: sizeRange,
    },
    {
      key: "area",
      label: "Project area",
      icon: Layers,
      value: (p) => (p.areaAcres > 0 ? `${p.areaAcres} acres` : null),
      rank: (p) => (p.areaAcres > 0 ? p.areaAcres : null),
      better: "higher",
      betterLabel: "Largest project area",
    },
    {
      key: "towers",
      label: "Towers",
      icon: Building2,
      value: (p) => (p.towers > 0 ? `${p.towers}` : null),
    },
    {
      key: "units",
      label: "Total units",
      icon: Users,
      value: (p) => (p.totalUnits ? p.totalUnits.toLocaleString("en-IN") : null),
    },
    {
      key: "possession",
      label: "Possession",
      icon: CalendarCheck,
      // The label often repeats the status ("Under Construction · Nov 2030");
      // the status is already implied, so only the date is shown.
      value: (p) => p.possessionDate.replace(/^.*· /, "") || p.possession || null,
      rank: possessionRank,
      better: "lower",
      betterLabel: "Earliest possession",
    },
    {
      key: "amenities",
      label: "Amenities",
      icon: Dumbbell,
      value: (p) =>
        p.amenityList.length > 0
          ? `${amenityCount(p)} of ${p.amenityList.length}`
          : null,
      rank: (p) => (p.amenityList.length > 0 ? amenityCount(p) : null),
      better: "higher",
      betterLabel: "Most amenities offered",
    },
    {
      key: "metro",
      label: "Nearest metro",
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
        p.location.connectivityIndex > 0
          ? `${p.location.connectivityIndex}/100`
          : null,
      rank: (p) =>
        p.location.connectivityIndex > 0 ? p.location.connectivityIndex : null,
      better: "higher",
      betterLabel: "Best connectivity score",
    },
    {
      key: "bestfor",
      label: "Best for",
      icon: Users,
      value: (p) => result.scores[p.id]?.bestFor.join(", ") || null,
    },
    {
      key: "rera",
      label: "RERA ID",
      icon: BadgeCheck,
      value: (p) => p.reraId || null,
    },
  ];
}

/**
 * The whole comparison in one screen: every property as a column, every
 * comparable fact as a compact row.
 *
 * Rows with no data on any property are dropped rather than printed as a line
 * of dashes, and where "better" is objective (cheaper, sooner, more amenities,
 * higher score) the winning cell is marked — with the reason in its tooltip, so
 * the highlight is never an unexplained opinion.
 */
export function AtAGlance({
  properties,
  result,
  expanded,
  onToggleExpanded,
}: {
  properties: Property[];
  result: ComparisonResult;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const remove = useComparison((s) => s.remove);
  const n = properties.length;
  const hasRoom = n < MAX_COMPARE;
  // One empty column when there is room — enough to invite a fourth without
  // padding the table with placeholder columns.
  const columns = n + (hasRoom ? 1 : 0);

  const rows = React.useMemo(() => buildRows(result), [result]);

  // Winner per row, or null when nothing ranks or the best value is a tie.
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

  // The empty "add" column is fixed and narrow: it carries one dropdown and a
  // blank cell per row, so an equal share of the width would be mostly padding.
  const grid: React.CSSProperties = {
    gridTemplateColumns: `minmax(132px, 168px) repeat(${n}, minmax(0, 1fr))${
      hasRoom ? " 215px" : ""
    }`,
    minWidth: `${168 + n * 180 + (hasRoom ? 215 : 0)}px`,
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-glass">
      <div className="overflow-x-auto">
        <div style={grid} className="grid">
          {/* ── header: OVERVIEW + one cell per property ────────────────── */}
          <div className="sticky left-0 z-[2] flex items-center bg-card px-4 py-4">
            <span className="text-xs font-bold uppercase tracking-wide text-accent">
              Overview
            </span>
          </div>

          {properties.map((p) => {
            const isTop = result.ranking[0] === p.id;
            return (
              <div
                key={p.id}
                className={cn(
                  "border-l border-border p-3",
                  isTop && "bg-accent/[0.05]",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span className="relative h-14 w-16 shrink-0 overflow-hidden rounded-lg">
                    <CoverImage
                      src={p.image}
                      alt={p.name}
                      gradient={p.gradient}
                      sizes="64px"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-1">
                      <span className="min-w-0 flex-1 text-sm font-bold leading-tight text-foreground">
                        {p.name}
                      </span>
                      <button
                        onClick={() => remove(p.id)}
                        aria-label={`Remove ${p.name} from the comparison`}
                        className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {p.locality}
                      {p.city ? `, ${p.city}` : ""}
                    </div>
                    {p.priceLakh > 0 && (
                      <div className="mt-0.5 text-sm font-extrabold text-accent">
                        {formatPriceLakh(p.priceLakh)}
                        <span className="text-[10px] font-medium text-muted-foreground">*</span>
                      </div>
                    )}
                    {isTop && n > 1 && (
                      <span className="mt-1 inline-block rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent-foreground">
                        ★ Top pick
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {hasRoom && (
            <div className="border-l border-border p-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Compare with
              </p>
              <PropertyPicker
                mode="add"
                trigger={({ toggle }) => (
                  <button
                    onClick={toggle}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Select a property</span>
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  </button>
                )}
              />
            </div>
          )}

          {/* ── rows ─────────────────────────────────────────────────────── */}
          {visibleRows.map((row) => {
            const Icon = row.icon;
            const winner = winners.get(row.key);
            return (
              <React.Fragment key={row.key}>
                <div className="sticky left-0 z-[2] flex items-center gap-2 border-t border-border bg-card px-4 py-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-accent" />
                  <span className="text-xs font-bold text-foreground">{row.label}</span>
                </div>
                {properties.map((p) => {
                  const text = row.value(p);
                  const isWinner = winner === p.id;
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center gap-1.5 border-l border-t border-border px-3 py-2.5",
                        result.ranking[0] === p.id && "bg-accent/[0.05]",
                      )}
                    >
                      <span
                        className={cn(
                          "break-words text-xs",
                          text == null
                            ? "text-muted-foreground/60"
                            : isWinner
                              ? "font-bold text-accent"
                              : "font-semibold text-foreground",
                          row.key === "rera" && "break-all text-[11px]",
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
                {hasRoom && <div className="border-l border-t border-border" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center border-t border-border p-4">
        <button
          onClick={onToggleExpanded}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-accent transition-colors hover:bg-accent/10"
        >
          {expanded ? "Hide detailed comparison" : "View All Features"}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
          />
        </button>
      </div>
    </div>
  );
}
