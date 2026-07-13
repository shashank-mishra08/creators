"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  Check,
  ChevronRight,
  Dumbbell,
  Expand,
  GitCompareArrows,
  Heart,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Train,
  Waves,
} from "lucide-react";
import type { AmenityKey, Property } from "@/lib/types";
import { useComparison } from "@/store/comparison";
import { useAuth } from "@/store/auth";
import { useMounted } from "@/lib/use-mounted";
import { setPendingAction } from "@/lib/pending-action";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { Lightbox } from "@/components/ui/lightbox";
import { cn, formatPriceLakh } from "@/lib/utils";

const EXPERT_PHONE = "+919252996677";

const AMENITY_LABELS: Record<AmenityKey, string> = {
  pool: "Swimming Pool",
  gym: "Gymnasium",
  clubhouse: "Clubhouse",
  security: "24/7 Security",
  sports: "Sports Court",
  kidsArea: "Kids Play Area",
  coworking: "Co-working Space",
  powerBackup: "Power Backup",
};
const AMENITY_ORDER: AmenityKey[] = [
  "pool",
  "clubhouse",
  "gym",
  "sports",
  "kidsArea",
  "coworking",
  "security",
  "powerBackup",
];

export function PropertyDetail({
  property: p,
  similar,
  reviewAvg,
  reviewCount,
}: {
  property: Property;
  similar: Property[];
  reviewAvg: number | null;
  reviewCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useMounted();

  const inCompare = useComparison((s) => s.selected.includes(p.id));
  const toggleCompare = useComparison((s) => s.toggle);
  const user = useAuth((s) => s.user);
  const toggleShortlist = useAuth((s) => s.toggleShortlist);
  const saved = useAuth((s) => s.savedIds.includes(p.id));
  const shortlisted = mounted && saved;

  const handleShortlist = () => {
    if (!user) {
      setPendingAction({ type: "shortlist", propertyId: p.id });
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    toggleShortlist(p.id);
  };

  const rating = reviewAvg ?? p.builder.rating;

  const [activePlan, setActivePlan] = React.useState(0);
  // Only surface floor plans backed by a real brochure image — never present a
  // config card with a gradient placeholder as a "floor plan" (e.g. projects
  // with a datasheet but no brochure). When none exist, we show a soft notice.
  const floorPlansWithImages = p.floorPlans.filter((fp) => fp.image);
  const hasFloorPlans = floorPlansWithImages.length > 0;
  const plan = floorPlansWithImages[activePlan] ?? floorPlansWithImages[0];
  const [zoom, setZoom] = React.useState<string | null>(null);

  const mapsQuery = encodeURIComponent(`${p.name} ${p.locality} ${p.city}`);
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const availableAmenities = p.amenityList.filter((a) => a.available);

  // Gallery side tiles — ONLY real brochure images (no empty placeholder slots).
  const tiles: string[] = [...p.gallery].slice(0, 4);

  const loc = [
    { icon: Train, label: "Metro Station", value: p.location.metroKm },
    { icon: ShieldCheck, label: "Hospital", value: p.location.hospitalKm },
    { icon: Building2, label: "School", value: p.location.schoolKm },
    { icon: MapPin, label: "Expressway", value: p.location.airportKm },
  ];

  const faqs = [
    {
      q: "What is the possession date of the project?",
      a: `Possession is ${p.possession === "Ready to Move" ? "available now" : `expected by ${p.possessionDate}`}.`,
    },
    {
      q: "Is the project RERA registered?",
      a: p.reraId
        ? `Yes, this project is RERA registered (RERA ID: ${p.reraId}).`
        : "RERA details are being updated for this project.",
    },
    {
      q: "What are the available configurations?",
      a: `This project offers ${p.configs} configurations${p.floorPlans.length ? `, from ${Math.min(...p.floorPlans.map((f) => f.areaSqFt)).toLocaleString("en-IN")} sq.ft onwards` : ""}.`,
    },
    {
      q: "Is metro connectivity available?",
      a: p.location.metroKm > 0
        ? `The nearest metro station is approximately ${p.location.metroKm} minutes away.`
        : "-",
    },
  ];

  return (
    <div className="container py-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link href="/properties" className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-accent">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Listings
        </Link>
        <span className="opacity-40">|</span>
        <Link href="/" className="hover:text-accent">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/properties" className="hover:text-accent">Apartments</Link>
        <ChevronRight className="h-3 w-3" />
        <span>{p.locality}, {p.city}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-accent">Property Details</span>
      </div>

      {/* Gallery — right column only appears when there are real photos, and it
          stretches to fill so there are never empty placeholder tiles. */}
      <div className={cn("grid gap-3", tiles.length > 0 && "lg:grid-cols-[1.6fr_1fr]")}>
        <div className="relative h-64 overflow-hidden rounded-2xl sm:h-80 lg:h-[26rem]">
          <CoverImage src={p.image} alt={p.name} gradient={p.gradient} label={p.name} sizes="(max-width:1024px) 100vw, 60vw" />
          <span className="absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm backdrop-blur">
            View Photos
          </span>
        </div>
        {tiles.length > 0 && (
          <div className="flex flex-col gap-3 lg:h-[26rem]">
            {tiles.map((src, i) => (
              <div key={i} className="relative h-32 flex-1 overflow-hidden rounded-xl">
                <CoverImage src={src} alt={`${p.name} view ${i + 1}`} gradient={p.gradient} sizes="30vw" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ActionButton active={shortlisted} onClick={handleShortlist} icon={Heart} label={shortlisted ? "Shortlisted" : "Shortlist"} />
        <ActionButton active={inCompare} onClick={() => toggleCompare(p.id)} icon={GitCompareArrows} label={inCompare ? "Added to Compare" : "Compare"} />
        <a href={mapsLink} target="_blank" rel="noreferrer">
          <ActionButton icon={MapPin} label="Get Location" />
        </a>
        <Link href="/compare">
          <ActionButton icon={GitCompareArrows} label="Go to Compare" />
        </Link>
      </div>

      {/* Header card */}
      <div className="mt-4 grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-glass lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-primary dark:text-foreground">{p.builder.name} {p.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-accent" /> {p.locality}, {p.city}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm">
            <Building2 className="h-4 w-4 text-accent" />
            <span className="text-muted-foreground">By</span>
            <span className="font-bold text-accent">{p.builder.name}</span>
          </p>
          {p.reraId && (
            <span className="mt-2 inline-block rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
              RERA ID: {p.reraId}
            </span>
          )}
          <div className="mt-2 flex items-center gap-1.5 text-sm">
            <span className="inline-flex items-center gap-0.5 font-bold text-amber-500">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">({reviewCount} {reviewCount === 1 ? "Review" : "Reviews"})</span>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-3 lg:border-l lg:border-border lg:pl-5">
          <div>
            <div className="text-xs text-muted-foreground">Starting Price</div>
            <div className="font-display text-3xl font-extrabold text-accent">
              {formatPriceLakh(p.priceLakh)}<span className="text-base">*</span>
            </div>
            <div className="text-xs text-muted-foreground">{p.configs} · {p.priceRangeLabel}</div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a href={`tel:${EXPERT_PHONE}`} className="flex-1">
              <Button variant="accent" size="sm" className="w-full">
                <CalendarCheck className="h-4 w-4" /> Book Site Visit
              </Button>
            </a>
            <a href={`tel:${EXPERT_PHONE}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Phone className="h-4 w-4" /> Contact Expert
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-5 shadow-glass sm:grid-cols-3 lg:grid-cols-6">
        <Stat icon={CalendarCheck} label="Possession" value={p.possession === "Ready to Move" ? "Ready" : p.possessionDate} />
        <Stat icon={Building2} label="Total Area" value={p.areaAcres > 0 ? `${p.areaAcres} Acres` : "-"} />
        <Stat icon={Building2} label="Towers" value={p.towers > 0 ? `${p.towers} Towers` : "-"} />
        <Stat icon={Building2} label="Total Units" value={p.totalUnits ? p.totalUnits.toLocaleString("en-IN") : "-"} />
        <Stat icon={ShieldCheck} label="Clubhouse" value={p.amenities.clubhouse ? "Yes" : "No"} />
        <Stat icon={Train} label="Metro Distance" value={p.location.metroKm > 0 ? `${p.location.metroKm} min` : "-"} />
      </div>

      {/* Project Details — full description from the source sheet */}
      {p.description.trim() && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-glass">
          <h2 className="mb-3 font-display text-base font-bold text-primary dark:text-foreground">Project Details</h2>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            {p.description
              .split(/\n+/)
              .map((para) => para.trim())
              .filter(Boolean)
              .map((para, i) => (
                <p key={i}>{para}</p>
              ))}
          </div>
        </div>
      )}

      {/* Price & Configuration */}
      <div className="mt-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
          <h2 className="mb-3 font-display text-base font-bold text-primary dark:text-foreground">Price & Configuration</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Configuration</th>
                  <th className="px-3 py-2 text-left font-semibold">Area (sq.ft.)</th>
                  <th className="px-3 py-2 text-left font-semibold">Price</th>
                </tr>
              </thead>
              <tbody>
                {p.floorPlans.map((fp, i) => (
                  <tr key={`${fp.config}-${fp.areaSqFt}-${i}`} className="border-t border-border">
                    <td className="px-3 py-2 font-semibold text-foreground">{fp.config}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fp.areaSqFt.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2 font-semibold text-accent">{fp.priceLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floor Plans + Amenities */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
          <h2 className="mb-3 font-display text-base font-bold text-primary dark:text-foreground">Floor Plans</h2>
          {!hasFloorPlans && (
            <p className="text-sm text-muted-foreground">Floor plans will be available soon.</p>
          )}
          <div className="mb-3 flex flex-wrap gap-2">
            {floorPlansWithImages.map((fp, i) => (
              <button
                key={`${fp.config}-${fp.areaSqFt}-${i}`}
                onClick={() => setActivePlan(i)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                  activePlan === i
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border text-foreground hover:border-accent/50",
                )}
              >
                {fp.config} · {fp.areaSqFt.toLocaleString("en-IN")} sq.ft
              </button>
            ))}
          </div>
          {plan && (
            <div className="grid gap-3 sm:grid-cols-[1.3fr_1fr]">
              <button
                type="button"
                onClick={() => plan.image && setZoom(plan.image)}
                className={cn(
                  "group relative h-48 overflow-hidden rounded-xl border border-border",
                  plan.image ? "cursor-zoom-in" : "cursor-default",
                )}
              >
                <CoverImage src={plan.image} alt={`${p.name} ${plan.config} floor plan`} gradient={p.gradient} label={`${plan.config} · ${plan.areaSqFt.toLocaleString("en-IN")} sq.ft`} sizes="360px" />
                {plan.image && (
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-semibold text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                    <Expand className="h-3 w-3" /> Expand
                  </span>
                )}
              </button>
              <div className="rounded-xl bg-muted/50 p-3">
                <div className="text-sm font-bold text-foreground">{plan.config} Floor Plan</div>
                <dl className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  <div className="flex justify-between gap-2">
                    <dt>Super Area</dt>
                    <dd className="font-semibold text-foreground">{plan.areaSqFt.toLocaleString("en-IN")} sq.ft</dd>
                  </div>
                  {plan.carpetAreaSqFt != null && (
                    <div className="flex justify-between gap-2">
                      <dt>Carpet Area</dt>
                      <dd className="font-semibold text-foreground">{plan.carpetAreaSqFt.toLocaleString("en-IN")} sq.ft</dd>
                    </div>
                  )}
                  {plan.builtUpAreaSqFt != null && (
                    <div className="flex justify-between gap-2">
                      <dt>Built-up Area</dt>
                      <dd className="font-semibold text-foreground">{plan.builtUpAreaSqFt.toLocaleString("en-IN")} sq.ft</dd>
                    </div>
                  )}
                  {plan.balconyAreaSqFt != null && (
                    <div className="flex justify-between gap-2">
                      <dt>Balcony Area</dt>
                      <dd className="font-semibold text-foreground">{plan.balconyAreaSqFt.toLocaleString("en-IN")} sq.ft</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-2 text-sm font-bold text-accent">{plan.priceLabel}</div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-primary dark:text-foreground">
            Amenities
            {availableAmenities.length > 0 && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">
                {availableAmenities.length}
              </span>
            )}
          </h2>
          {availableAmenities.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {availableAmenities.map((a) => (
                <div key={a.key} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground">
                  <Check className="h-3.5 w-3.5 shrink-0 text-accent" /> {a.label}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not Available</p>
          )}
        </div>
      </div>

      {/* Location & Connectivity */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
          <h2 className="mb-3 font-display text-base font-bold text-primary dark:text-foreground">Location & Connectivity</h2>
          <ul className="space-y-2.5">
            {loc.map((l) => (
              <li key={l.label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <l.icon className="h-4 w-4 text-accent" /> {l.label}
                </span>
                <span className="font-semibold text-foreground">{l.value > 0 ? `${l.value} min` : "-"}</span>
              </li>
            ))}
          </ul>
          <a href={mapsLink} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-bold text-accent hover:underline">
            View on Google Maps
          </a>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border shadow-glass">
          <iframe
            title={`Map of ${p.name}`}
            src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
            className="h-full min-h-[16rem] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      {/* About the Builder */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-glass">
        <h2 className="mb-3 font-display text-base font-bold text-primary dark:text-foreground">About the Builder</h2>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ background: p.builder.logoColor }}>
              <Building2 className="h-6 w-6" />
            </span>
            <div className="font-display text-lg font-bold text-primary dark:text-foreground">{p.builder.name}</div>
          </div>
          {p.builder.established > 0 && (
            <Metric value={`${new Date().getFullYear() - p.builder.established}+`} label="Years of Experience" />
          )}
          {p.builder.deliveredProjects > 0 && (
            <Metric value={`${p.builder.deliveredProjects}+`} label="Projects Delivered" />
          )}
          {p.builder.rating > 0 && <Metric value={p.builder.rating.toFixed(1)} label="Builder Rating" />}
        </div>
      </div>

      {/* Similar Properties */}
      {similar.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-4 font-display text-xl font-extrabold text-primary dark:text-foreground">Similar Properties You May Like</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {similar.map((s) => (
              <Link key={s.id} href={`/properties/${s.id}`} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-glass transition-transform hover:-translate-y-1">
                <div className="relative h-36 w-full">
                  <CoverImage src={s.image} alt={s.name} gradient={s.gradient} label={s.name} sizes="280px" />
                </div>
                <div className="p-3">
                  <div className="truncate text-sm font-bold text-primary dark:text-foreground">{s.builder.name} {s.name}</div>
                  <div className="truncate text-[11px] font-semibold text-accent">{s.builder.name}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {s.locality}, {s.city}
                  </div>
                  <div className="mt-1 text-sm font-extrabold text-accent">{formatPriceLakh(s.priceLakh)}*</div>
                  <div className="text-[11px] text-muted-foreground">{s.configs}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* FAQ + Expert */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
          <h2 className="mb-3 font-display text-base font-bold text-primary dark:text-foreground">Frequently Asked Questions</h2>
          <div className="divide-y divide-border">
            {faqs.map((f) => (
              <details key={f.q} className="group py-3">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-foreground">
                  {f.q}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-5">
          <h2 className="font-display text-base font-bold text-primary dark:text-foreground">Need Expert Advice?</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Our property experts will help you find the best deal — best price, free
            site visit, detailed cost sheet and home-loan assistance.
          </p>
          <a href={`tel:${EXPERT_PHONE}`}>
            <Button variant="accent" size="md" className="mt-4 w-full">
              <Phone className="h-4 w-4" /> Get a Callback
            </Button>
          </a>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Call us: +91 92529 96677</p>
        </div>
      </div>

      {/* Floor-plan lightbox */}
      {zoom && <Lightbox src={zoom} onClose={() => setZoom(null)} />}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
        active ? "border-accent bg-accent/10 text-accent" : "border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      <Icon className={cn("h-4 w-4", active && "fill-accent")} /> {label}
    </button>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-xl font-extrabold text-accent">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function AmenityIcon({ k }: { k: AmenityKey }) {
  const cls = "h-4 w-4 text-accent";
  if (k === "pool") return <Waves className={cls} />;
  if (k === "gym") return <Dumbbell className={cls} />;
  if (k === "security") return <ShieldCheck className={cls} />;
  return <Building2 className={cls} />;
}
