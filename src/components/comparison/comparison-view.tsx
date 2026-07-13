"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  Building2,
  Check,
  ClipboardList,
  Download,
  Dumbbell,
  Heart,
  IndianRupee,
  LayoutPanelTop,
  MapPin,
  Phone,
  Plus,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import type { AmenityKey, ComparisonResult, Property } from "@/lib/types";
import { compareProperties, scoreTier } from "@/lib/scoring";
import { useComparison } from "@/store/comparison";
import { useAuth, selectShortlistIds } from "@/store/auth";
import { useMounted } from "@/lib/use-mounted";
import { setPendingAction } from "@/lib/pending-action";
import { LocationMap } from "@/components/comparison/location-map";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { Lightbox } from "@/components/ui/lightbox";
import { cn, formatPriceLakh } from "@/lib/utils";

const NAV = [
  { id: "overview", icon: ClipboardList, label: "Overview" },
  { id: "price", icon: IndianRupee, label: "Price & Configuration" },
  { id: "amenities", icon: Dumbbell, label: "Amenities" },
  { id: "location", icon: MapPin, label: "Location & Connectivity" },
  { id: "floorplans", icon: LayoutPanelTop, label: "Floor Plans" },
  { id: "bestfor", icon: Users, label: "Best For" },
  { id: "similar", icon: Building2, label: "Similar Properties" },
];

const AMENITIES: { key: AmenityKey; label: string }[] = [
  { key: "clubhouse", label: "Clubhouse" },
  { key: "pool", label: "Swimming Pool" },
  { key: "gym", label: "Gymnasium" },
  { key: "sports", label: "Sports Court" },
  { key: "kidsArea", label: "Kids Play Area" },
  { key: "coworking", label: "Co-working Space" },
  { key: "powerBackup", label: "Power Backup" },
  { key: "security", label: "24/7 Security" },
];

export function ComparisonView({
  properties,
  similar = [],
  result: providedResult,
}: {
  properties: Property[];
  similar?: Property[];
  /** Server-computed scoring result. When present it is reused as-is; the
   *  client only recomputes as a fallback (e.g. if rendered without it). */
  result?: ComparisonResult;
}) {
  const n = properties.length;
  const result = React.useMemo(
    () => providedResult ?? compareProperties(properties),
    [providedResult, properties],
  );
  const remove = useComparison((s) => s.remove);
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const toggleShortlist = useAuth((s) => s.toggleShortlist);
  const savedIds = useAuth(selectShortlistIds);
  const isSaved = (id: string) => mounted && savedIds.includes(id);
  const handleShortlist = (id: string) => {
    if (!user) {
      setPendingAction({ type: "shortlist", propertyId: id });
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    toggleShortlist(id);
  };

  // Union of every amenity across the compared properties (complete comparison).
  const unionAmenities = React.useMemo(() => {
    const map = new Map<string, string>();
    properties.forEach((p) =>
      p.amenityList.forEach((a) => {
        if (!map.has(a.key)) map.set(a.key, a.label);
      }),
    );
    return [...map.entries()]
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [properties]);
  const hasAmenity = (p: Property, key: string) =>
    p.amenityList.some((a) => a.key === key && a.available);

  const setToast = useComparison((s) => s.setToast);
  const [saving, setSaving] = React.useState(false);
  const handleSaveComparison = async () => {
    const propertyIds = properties.map((p) => p.id);
    if (!user) {
      // Guest: remember the intent, authenticate, then it replays automatically.
      setPendingAction({ type: "saveComparison", propertyIds });
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/saved-comparisons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyIds }),
      });
      setToast(res.ok ? "Comparison saved." : "Could not save. Please try again.");
    } catch {
      setToast("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Responsive comparison columns. Columns fill the row on desktop and for a
  // 2-up compare (so 2-up fits any phone with no scroll). For 3–4 properties on
  // narrow screens a min-width kicks in so columns stay readable and the section
  // scrolls horizontally instead of crushing. Desktop is unaffected (the row is
  // always wider than the min-width there).
  const COL_MIN = 172; // px per property column once horizontal scroll engages
  const valueCols: React.CSSProperties = {
    gridTemplateColumns: `repeat(${n}, minmax(0,1fr))`,
    minWidth: n > 2 ? `${n * COL_MIN}px` : undefined,
  };

  // Per-property selected floor-plan (click a config to switch the preview).
  const [planIdx, setPlanIdx] = React.useState<Record<string, number>>({});
  const selPlan = (id: string) => planIdx[id] ?? 0;
  const [zoom, setZoom] = React.useState<string | null>(null);

  return (
    <div className="bg-muted/30">
      {/* Page heading for a11y/SEO; the visible design leads with the top bar. */}
      <h1 className="sr-only">
        Compare {properties.map((p) => p.name).join(" vs ")}
      </h1>
      {/* Top bar */}
      <div className="border-b border-border bg-card">
        <div className="container flex h-14 items-center justify-between lg:px-10">
          <Link
            href="/properties"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Listings
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (navigator.share)
                  navigator.share({ title: "Property Comparison", url: location.href }).catch(() => {});
                else navigator.clipboard?.writeText(location.href);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5" /> Download PDF
            </button>
            <button
              onClick={handleSaveComparison}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-accent bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/15 disabled:opacity-60"
            >
              <Bookmark className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="container grid grid-cols-1 gap-8 py-6 lg:grid-cols-[248px_1fr] lg:px-10">
        {/* ───────────── LEFT SIDEBAR ───────────── */}
        <aside className="hidden h-fit flex-col gap-4 lg:sticky lg:top-20 lg:flex">
          {/* Compare list */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-glass">
            <h2 className="font-display text-sm font-bold text-primary dark:text-foreground">
              Compare Properties
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">{n}/4 Selected</p>
            <div className="space-y-2">
              {properties.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2.5 rounded-xl border border-border p-2"
                >
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                    <CoverImage src={p.image} alt={p.name} gradient={p.gradient} sizes="40px" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-foreground">{p.builder.name} {p.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{p.locality}</div>
                  </div>
                  {n > 2 && (
                    <button
                      onClick={() => remove(p.id)}
                      aria-label="Remove"
                      className="text-muted-foreground hover:text-danger"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {n < 4 && (
              <Link href="/properties">
                <button className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2 text-xs font-semibold text-muted-foreground hover:border-accent/60 hover:text-accent">
                  <Plus className="h-3.5 w-3.5" /> Add New Property
                </button>
              </Link>
            )}
          </div>

          {/* Section nav */}
          <nav className="rounded-2xl border border-border bg-card p-2 shadow-glass">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Expert card */}
          <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-center">
            <Image
              src="/art/support.png"
              alt=""
              width={120}
              height={90}
              className="mx-auto h-20 w-auto object-contain"
            />
            <h3 className="mt-2 font-display text-sm font-bold text-primary dark:text-foreground">
              Need Expert Advice?
            </h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Our property experts can help you choose the right property.
            </p>
            <a href="tel:+919252996677">
              <Button variant="accent" size="sm" className="mt-3 w-full">
                Talk to an Expert
              </Button>
            </a>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Call us: +91 92529 96677
            </p>
          </div>
        </aside>

        {/* ───────────── RIGHT CONTENT ───────────── */}
        <div className="min-w-0 space-y-6">
          {/* Property header cards with V/S */}
          <div className="overflow-x-auto">
          <div className="relative grid gap-4" style={valueCols}>
            {properties.map((p) => {
              const isTop = result.ranking[0] === p.id;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-card shadow-glass",
                    isTop ? "border-accent" : "border-border",
                  )}
                >
                  <div className="relative h-40 w-full">
                    <CoverImage src={p.image} alt={p.name} gradient={p.gradient} label={p.name} sizes="420px" />
                    {isTop && (
                      <span className="absolute left-3 top-3 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                        ★ Top pick
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-base font-bold text-primary dark:text-foreground">
                      {p.builder.name} {p.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-accent" /> {p.locality}
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        onClick={() => handleShortlist(p.id)}
                        className={cn(
                          "inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                          isSaved(p.id)
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-foreground hover:bg-muted",
                        )}
                      >
                        <Heart
                          className={cn("h-3.5 w-3.5", isSaved(p.id) && "fill-accent")}
                        />
                        Shortlist
                      </button>
                      <Link href={`/properties/${p.id}`} className="block">
                        <Button variant="accent" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* V/S badge — only for a 2-way comparison, like the design */}
            {n === 2 && (
              <div className="absolute left-1/2 top-[80px] z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-card bg-primary text-xs font-extrabold text-primary-foreground shadow-lift">
                V/S
              </div>
            )}
          </div>
          </div>

          {/* Quick Overview */}
          <Card id="overview">
            <CardTitle>Quick Overview</CardTitle>
            <div className="mt-4">
              <OverviewTable
                n={n}
                rows={[
                  { label: "Starting Price", values: properties.map((p) => formatPriceLakh(p.priceLakh) + "*") },
                  { label: "Configurations", values: properties.map((p) => p.configs) },
                  { label: "Total Area", values: properties.map((p) => `${p.areaAcres} Acres`) },
                  { label: "Towers", values: properties.map((p) => (p.towers ? `${p.towers} Towers` : "—")) },
                  { label: "Total Units", values: properties.map((p) => (p.totalUnits ? `${p.totalUnits.toLocaleString("en-IN")} Units` : "—")) },
                  { label: "Possession", values: properties.map((p) => p.possessionDate.replace(/^.*· /, "")) },
                  { label: "RERA ID", values: properties.map((p) => p.reraId) },
                ]}
              />
            </div>
          </Card>

          {/* Price & Configuration */}
          <SectionCard id="price" icon={IndianRupee} title="Price & Configuration">
            <OverviewTable
              n={n}
              rows={[
                {
                  label: "Starting Price",
                  values: properties.map((p) => formatPriceLakh(p.priceLakh) + "*"),
                  subs: properties.map(() => "Onwards"),
                },
                {
                  label: "Configurations",
                  values: properties.map((p) => p.configs),
                  subs: properties.map((p) => sqftRange(p)),
                },
              ]}
            />
          </SectionCard>

          {/* Amenities */}
          <SectionCard id="amenities" icon={Dumbbell} title="Amenities">
            {/* Scrolls horizontally for 3–4 properties; the amenity label column
                stays pinned (sticky) so rows are always identifiable. */}
            <div className="overflow-x-auto rounded-xl border border-border">
              <div
                className="divide-y divide-border"
                style={{ minWidth: n > 2 ? `${144 + n * 64}px` : undefined }}
              >
                {unionAmenities.map((a) => (
                  <div key={a.key} className="grid items-center py-2.5" style={{ gridTemplateColumns: `minmax(130px,1fr) repeat(${n}, 64px)` }}>
                    <span className="sticky left-0 z-[1] bg-card px-4 text-sm font-medium text-foreground">{a.label}</span>
                    {properties.map((p) => (
                      <span key={p.id} className="flex justify-center">
                        {hasAmenity(p, a.key) ? (
                          <Check className="h-5 w-5 rounded-full bg-success/15 p-0.5 text-success" />
                        ) : (
                          <X className="h-5 w-5 rounded-full bg-danger/15 p-0.5 text-danger/70" />
                        )}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Location & Connectivity */}
          <SectionCard id="location" icon={MapPin} title="Location & Connectivity">
            <p className="mb-3 text-sm font-bold text-foreground">Connectivity</p>
            <div className="overflow-x-auto">
            <div className="grid gap-4" style={valueCols}>
              {properties.map((p) => (
                <div key={p.id} className="space-y-3">
                  <ul className="space-y-1.5">
                    {connectivity(p).map((c) => (
                      <li key={c.label} className="flex items-center justify-between gap-2 text-xs">
                        <span
                          className={cn(
                            "flex items-center gap-1.5",
                            c.emphasize ? "font-bold text-foreground" : "text-muted-foreground",
                          )}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          {c.label}
                        </span>
                        <span
                          className={cn(
                            "shrink-0",
                            c.emphasize ? "font-bold text-accent" : "font-semibold text-foreground",
                          )}
                        >
                          {c.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="h-44 w-full overflow-hidden rounded-xl">
                    <LocationMap property={p} />
                  </div>
                </div>
              ))}
            </div>
            </div>
          </SectionCard>

          {/* Floor Plans */}
          <SectionCard id="floorplans" icon={LayoutPanelTop} title="Floor Plans">
            {/* Two grid rows — all config chips share one row (so wrapping to
                multiple lines doesn't push one card down) and all cards share the
                next row, keeping the floor-plan cards aligned across columns. */}
            <div className="overflow-x-auto">
            <div className="grid gap-x-4 gap-y-2" style={valueCols}>
              {properties.map((p) => (
                <div key={`chips-${p.id}`} className="flex flex-col gap-1">
                  {p.floorPlans.map((fp, i) => {
                    const active = selPlan(p.id) === i;
                    return (
                      <button
                        type="button"
                        key={`${fp.config}-${fp.areaSqFt}-${i}`}
                        onClick={() => setPlanIdx((s) => ({ ...s, [p.id]: i }))}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-xs transition-colors",
                          active ? "bg-accent text-accent-foreground" : "bg-accent/[0.07] hover:bg-accent/15",
                        )}
                      >
                        <span className={cn("font-bold", active ? "text-accent-foreground" : "text-accent")}>{fp.config}</span>
                        <span className={cn("font-semibold", active ? "text-accent-foreground/90" : "text-muted-foreground")}>{fp.areaSqFt.toLocaleString("en-IN")} sq.ft</span>
                      </button>
                    );
                  })}
                </div>
              ))}
              {properties.map((p) => {
                const fp = p.floorPlans[selPlan(p.id)] ?? p.floorPlans[0];
                return (
                  <div key={`card-${p.id}`}>
                    {fp && (
                      <div className="overflow-hidden rounded-xl border border-border bg-background">
                        <button
                          type="button"
                          onClick={() => fp.image && setZoom(fp.image)}
                          className={cn("relative block h-44 w-full bg-muted", fp.image && "cursor-zoom-in")}
                        >
                          <CoverImage src={fp.image} alt={`${p.name} ${fp.config} floor plan`} gradient={p.gradient} label={`${fp.config} · ${fp.areaSqFt} sq.ft`} sizes="360px" />
                        </button>
                        <div className="flex items-center justify-between px-3 py-2">
                          <div>
                            <div className="text-sm font-bold">{fp.config}</div>
                            <div className="text-[11px] text-muted-foreground">{fp.areaSqFt.toLocaleString("en-IN")} sq.ft</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => fp.image && setZoom(fp.image)}
                            className={cn("text-xs font-semibold text-accent", fp.image ? "hover:underline" : "opacity-50")}
                          >
                            {fp.image ? "View Floor Plan" : "Floor Plan"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          </SectionCard>

          {/* Best For */}
          <SectionCard id="bestfor" icon={Users} title="Best For">
            <div className="overflow-x-auto">
            <div className="grid gap-4" style={valueCols}>
              {properties.map((p) => {
                const persona = bestForPersona(p, result.scores[p.id].bestFor);
                return (
                  <div key={p.id} className="flex items-start gap-3">
                    <Image
                      src={persona.image}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0 rounded-xl bg-muted object-contain p-1.5"
                    />
                    <div>
                      <div className="text-sm font-bold text-primary dark:text-foreground">
                        {persona.title}
                      </div>
                      <ul className="mt-1 space-y-0.5">
                        {persona.bullets.map((b) => (
                          <li key={b} className="text-xs text-muted-foreground">
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </SectionCard>

          {/* Similar Properties */}
          <div id="similar" className="scroll-mt-20">
            <h3 className="mb-4 font-display text-lg font-bold text-primary dark:text-foreground">
              Similar Properties
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {similar.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-glass">
                  <div className="relative h-32 w-full">
                    <CoverImage src={p.image} alt={p.name} gradient={p.gradient} label={p.name} sizes="280px" />
                  </div>
                  <div className="p-3">
                    <div className="truncate text-sm font-bold text-primary dark:text-foreground">
                      {p.builder.name} {p.name}
                    </div>
                    <div className="mb-2 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3 text-accent" /> {p.locality}
                    </div>
                    <Link href={`/properties/${p.id}`}>
                      <Button variant="subtle" size="sm" className="w-full">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floor-plan lightbox */}
      {zoom && <Lightbox src={zoom} onClose={() => setZoom(null)} />}
    </div>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

function Card({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 rounded-2xl border border-border bg-card p-5 shadow-glass">
      {children}
    </section>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-base font-bold text-primary dark:text-foreground">
      {children}
    </h2>
  );
}

function SectionCard({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 rounded-2xl border border-border bg-card p-5 shadow-glass">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[160px_1fr]">
        <div className="flex items-start gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <Icon className="h-5 w-5 text-accent" />
          </span>
          <h2 className="pt-1.5 font-display text-sm font-bold leading-tight text-primary dark:text-foreground">
            {title}
          </h2>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

type OverviewItem = { label: string; values: string[]; subs?: string[] };

/** Comparison table where the centre labels sit inside a SINGLE continuous
 *  purple band spanning all rows (the design's signature 2-up style). Falls back
 *  to a label-left layout for 3–4 columns. */
function OverviewTable({ rows, n }: { rows: OverviewItem[]; n: number }) {
  if (n === 2) {
    return (
      <div className="relative grid grid-cols-[1fr_minmax(84px,auto)_1fr] overflow-hidden rounded-xl border border-border md:grid-cols-[1fr_minmax(150px,auto)_1fr]">
        {/* one continuous purple band behind the centre labels */}
        <div
          className="rounded-xl"
          style={{
            gridColumn: 2,
            gridRow: `1 / span ${rows.length}`,
            background: "hsl(var(--accent) / 0.12)",
          }}
        />
        {rows.map((r, i) => (
          <React.Fragment key={r.label}>
            <div
              className={cn(
                "flex min-w-0 flex-col items-center justify-center px-3 py-3.5 text-center",
                i > 0 && "border-t border-border",
              )}
              style={{ gridColumn: 1, gridRow: i + 1 }}
            >
              <span className="break-words text-sm font-bold text-foreground">{r.values[0]}</span>
              {r.subs?.[0] && (
                <span className="text-[11px] text-muted-foreground">{r.subs[0]}</span>
              )}
            </div>
            <div
              className={cn(
                "relative z-10 flex items-center justify-center px-4 py-3.5 text-center",
                i > 0 && "border-t border-border/50",
              )}
              style={{ gridColumn: 2, gridRow: i + 1 }}
            >
              <span className="text-xs font-bold uppercase tracking-wide text-accent">
                {r.label}
              </span>
            </div>
            <div
              className={cn(
                "flex min-w-0 flex-col items-center justify-center px-3 py-3.5 text-center",
                i > 0 && "border-t border-border",
              )}
              style={{ gridColumn: 3, gridRow: i + 1 }}
            >
              <span className="break-words text-sm font-bold text-foreground">{r.values[1]}</span>
              {r.subs?.[1] && (
                <span className="text-[11px] text-muted-foreground">{r.subs[1]}</span>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  // 3–4 columns: label on the left, values across. Scrolls horizontally on
  // narrow screens with the label column pinned (sticky) so rows stay readable.
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <div
        className="divide-y divide-border"
        style={{ minWidth: n > 2 ? `${132 + n * 96}px` : undefined }}
      >
        {rows.map((r) => (
          <div
            key={r.label}
            className="grid items-center gap-2 py-2.5"
            style={{ gridTemplateColumns: `132px repeat(${n}, 1fr)` }}
          >
            <span className="sticky left-0 z-[1] bg-card px-4 text-xs font-bold uppercase tracking-wide text-accent">
              {r.label}
            </span>
            {r.values.map((v, i) => (
              <div key={i} className="px-1 text-center">
                <div className="break-words text-sm font-bold text-foreground">{v}</div>
                {r.subs?.[i] && (
                  <div className="text-[11px] text-muted-foreground">{r.subs[i]}</div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function RatingRing({ rating, color }: { rating: number; color: string }) {
  const size = 72;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (rating / 5) * c;
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="font-display text-lg font-extrabold" style={{ color }}>
          {rating.toFixed(1)}
        </span>
        <span className="text-[9px] text-muted-foreground">/5</span>
      </div>
    </div>
  );
}

/* ---- data → display mappers (no change to underlying data) -------------- */

function sqftRange(p: Property): string {
  const areas = p.floorPlans.map((f) => f.areaSqFt).filter((n) => n > 0);
  if (areas.length === 0) return "—"; // no floor-plan areas in the source sheet
  return `${Math.min(...areas).toLocaleString("en-IN")} – ${Math.max(...areas).toLocaleString("en-IN")} sq.ft`;
}

function connectivity(p: Property) {
  // Source sheets provide travel TIME in minutes (the 4th metric is Expressway).
  return [
    { label: "Metro Station", value: p.location.metroKm > 0 ? `${p.location.metroKm} min` : "-", emphasize: true },
    { label: "Hospital", value: p.location.hospitalKm > 0 ? `${p.location.hospitalKm} min` : "-" },
    { label: "School", value: p.location.schoolKm > 0 ? `${p.location.schoolKm} min` : "-" },
    { label: "Expressway", value: p.location.airportKm > 0 ? `${p.location.airportKm} min` : "-" },
    { label: "Connectivity Score", value: `${p.location.connectivityIndex}/100` },
  ];
}

function investmentBullets(p: Property) {
  return [
    { label: "High Appreciation Potential", ok: p.investment.appreciationPct >= 9 },
    { label: "Upcoming Infrastructure Boost", ok: p.location.connectivityIndex >= 78 },
    { label: "Reputed Developer", ok: p.builder.rating >= 4.3 },
    { label: "High Rental Demand", ok: p.investment.rentalYieldPct >= 3.2 },
  ];
}

function bestForPersona(p: Property, tags: string[]) {
  if (tags.includes("Families")) {
    return {
      image: "/art/persona-family.png",
      title: "End users & families",
      bullets: [
        "Proximity to amenities & green spaces",
        "Larger open areas",
        "Peaceful living environment",
      ],
    };
  }
  if (tags.includes("Luxury Buyers")) {
    return {
      image: "/art/persona-traveler.png",
      title: "Luxury buyers",
      bullets: ["Premium specifications", "Gated privacy", "Prestige address"],
    };
  }
  return {
    image: "/art/persona-traveler.png",
    title: "Investors & frequent travellers",
    bullets: [
      "Earlier possession upside",
      "Better connectivity",
      "High rental yield potential",
    ],
  };
}
