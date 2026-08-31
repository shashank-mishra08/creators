"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Expand,
  GitCompareArrows,
  Heart,
  MapPin,
  Phone,
  Printer,
  ShieldCheck,
  Star,
  Train,
  Waves,
} from "lucide-react";
import type { AmenityKey, Property, PropertyReview } from "@/lib/types";
import { useComparison } from "@/store/comparison";
import { useAuth } from "@/store/auth";
import { useMounted } from "@/lib/use-mounted";
import { setPendingAction } from "@/lib/pending-action";
import { rememberProperty } from "@/lib/recent-properties";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/ui/share-button";
import { CoverImage } from "@/components/ui/cover-image";
import { PropertyVideo } from "@/components/property/property-video";
import { parseVideoSource } from "@/lib/video";
import { Lightbox } from "@/components/ui/lightbox";
import { SiteVisitModal } from "@/components/property/site-visit-modal";
import { PropertyReviews } from "@/components/reviews/property-reviews";
import { cn, formatPriceLakh } from "@/lib/utils";
import {
  compactBhkLabel,
  formatLocalityLabel,
  formatPropertyHeading,
  propertyFaqs,
  propertyPath,
} from "@/lib/seo";

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
  reviews = [],
  contactPhone,
}: {
  property: Property;
  similar: Property[];
  reviewAvg: number | null;
  reviewCount: number;
  /** Full review list for the section at the foot of the page. */
  reviews?: PropertyReview[];
  /** From admin Settings; falls back to the built-in expert number if unset. */
  contactPhone?: string;
}) {
  // Admin-configured contact number (Settings) with a safe fallback so the page
  // renders exactly as before when no number is set.
  const expertPhone = contactPhone?.trim() || EXPERT_PHONE;
  const expertPhoneDisplay = contactPhone?.trim() || "+91 92529 96677";
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

  // Feeds the "Recent Properties" shortlist in the review form. localStorage
  // only — no request, no database write, and harmless if it fails.
  React.useEffect(() => {
    rememberProperty(p.id);
  }, [p.id]);

  const [isSiteVisitOpen, setIsSiteVisitOpen] = React.useState(false);
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

  // Every real photo, cover first, de-duplicated — this is what the lightbox
  // pages through. The cover often also appears in p.gallery.
  const photos: string[] = React.useMemo(
    () => Array.from(new Set([p.image, ...p.gallery].filter(Boolean) as string[])),
    [p.image, p.gallery]
  );
  const [photoIndex, setPhotoIndex] = React.useState<number | null>(null);
  // Which photo the big tile is currently showing (the arrows drive this).
  const [cover, setCover] = React.useState(0);
  const openPhotos = (src: string) => {
    const i = photos.indexOf(src);
    setPhotoIndex(i >= 0 ? i : 0);
  };

  const loc = [
    { icon: Train, label: "Metro Station", value: p.location.metroKm },
    { icon: ShieldCheck, label: "Hospital", value: p.location.hospitalKm },
    { icon: Building2, label: "School", value: p.location.schoolKm },
    { icon: MapPin, label: "Expressway", value: p.location.airportKm },
  ];

  const faqs = propertyFaqs(p);
  // "ACE" + "Arte" → "ACE Arte". The same string the H1 and the <title> are
  // built from, so the section headings can never drift from them.
  const heading = formatPropertyHeading(p.builder.name, p.name);
  // Both read off the record, never asserted. The configurations a project
  // actually sells ("4/5 BHK" for County Clove, "3 BHK" for Saviour New) and
  // the locality as the title already spells it ("128" → "Sector 128").
  // Decided here rather than inside the card, because the builder block's own
  // width depends on whether a video will sit beside it. An unplayable URL
  // counts as no video, so the row does not split around an empty column.
  const hasVideo = parseVideoSource(p.videoUrl) !== null;
  const bhk = compactBhkLabel(p.configs);
  const localityLabel = formatLocalityLabel(p.locality, p.city);

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
        <Link href="/properties" className="hover:text-accent">Properties</Link>
        <ChevronRight className="h-3 w-3" />
        <span>{p.locality}, {p.city}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-accent">{p.name}</span>
      </div>

      {/* Gallery — right column only appears when there are real photos, and it
          stretches to fill so there are never empty placeholder tiles. */}
      <div className={cn("grid gap-3", tiles.length > 0 && "lg:grid-cols-[1.6fr_1fr]")}>
        <div className="group relative h-64 overflow-hidden rounded-2xl sm:h-80 lg:h-[26rem]">
          <button
            type="button"
            onClick={() => photos.length > 0 && setPhotoIndex(cover)}
            disabled={photos.length === 0}
            aria-label={`View photos of ${p.name}`}
            className="absolute inset-0 z-[1] cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default"
          >
            <CoverImage src={photos[cover] ?? p.image} alt={`${p.name} in ${p.locality}, ${p.city}`} gradient={p.gradient} label={p.name} sizes="(max-width:1024px) 100vw, 60vw" />
          </button>

          <span className="pointer-events-none absolute left-4 top-4 z-[2] rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm backdrop-blur">
            View Photos{photos.length > 1 && ` (${photos.length})`}
          </span>

          {/* Step through photos without opening the lightbox. */}
          {photos.length > 1 && (
            <>
              <GalleryArrow
                side="left"
                label="Previous photo"
                onClick={() => setCover((c) => (c - 1 + photos.length) % photos.length)}
              />
              <GalleryArrow
                side="right"
                label="Next photo"
                onClick={() => setCover((c) => (c + 1) % photos.length)}
              />
            </>
          )}
        </div>
        {tiles.length > 0 && (
          <div className="flex flex-col gap-3 lg:h-[26rem]">
            {tiles.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => openPhotos(src)}
                aria-label={`View ${p.name} photo ${i + 1}`}
                className="relative h-32 flex-1 cursor-zoom-in overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <CoverImage src={src} alt={`${p.name} view ${i + 1}`} gradient={p.gradient} sizes="30vw" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons. `data-print-hide` — none of them do anything on paper. */}
      <div data-print-hide className="mt-4 flex flex-wrap items-center gap-2">
        <ActionButton active={shortlisted} onClick={handleShortlist} icon={Heart} label={shortlisted ? "Shortlisted" : "Shortlist"} />
        <ActionButton active={inCompare} onClick={() => toggleCompare(p.id)} icon={GitCompareArrows} label={inCompare ? "Added to Compare" : "Compare"} />
        <a href={mapsLink} target="_blank" rel="noreferrer">
          <ActionButton icon={MapPin} label="Get Location" />
        </a>
        {/* The property's own address, not location.href — so a link shared
            from a filtered or scrolled state still opens this property. */}
        <ShareButton
          url={propertyPath(p)}
          title={`${p.builder.name} ${p.name}`}
          text={`${p.name} — ${p.locality}${p.city ? `, ${p.city}` : ""}`}
          label="Share"
          className="h-10 rounded-xl px-4 text-sm"
        />
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <Printer className="h-4 w-4" /> Print
        </button>
      </div>

      {/* Header card */}
      <div className="mt-4 grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-glass lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-primary dark:text-foreground">
            {heading} in {p.locality}, {p.city}
          </h1>
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
          <div data-print-hide className="flex flex-col gap-2 sm:flex-row">
            <Button variant="accent" size="sm" className="w-full flex-1" onClick={() => setIsSiteVisitOpen(true)}>
              <Phone className="h-4 w-4" /> Contact Expert
            </Button>
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
          <h2 className="mb-3 font-display text-base font-bold text-primary dark:text-foreground">{heading} Project Details</h2>
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
          <h2 className="mb-3 font-display text-base font-bold text-primary dark:text-foreground">{heading} Price & Configuration</h2>
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
          {/* Already on the record and shown nowhere until now — it is the
              number people compare projects on. */}
          {p.pricePerSqFt > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Approx. ₹{p.pricePerSqFt.toLocaleString("en-IN")} per sq.ft
            </p>
          )}
        </div>
      </div>

      {/* Tower Details — per-tower structure from the source sheet */}
      {p.towerList.length > 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-glass">
          <h2 className="mb-3 font-display text-base font-bold text-primary dark:text-foreground">Tower Details</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Tower</th>
                  <th className="px-3 py-2 text-left font-semibold">Floor Configuration</th>
                  <th className="px-3 py-2 text-left font-semibold">Lifts</th>
                  <th className="px-3 py-2 text-left font-semibold">Units / Floor</th>
                  <th className="px-3 py-2 text-left font-semibold">Total Units</th>
                </tr>
              </thead>
              <tbody>
                {p.towerList.map((t, i) => (
                  <tr key={`${t.name}-${i}`} className="border-t border-border">
                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-foreground">{t.name}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{t.floorPlan ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.lifts ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.unitsPerFloor ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.totalUnits != null ? t.totalUnits.toLocaleString("en-IN") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floor Plans + Amenities */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
          {/* "<name> 3 BHK floor plan" is the query; the BHK comes from the
              record, so a project that sells 4/5 BHK says 4/5 BHK. */}
          <h2 className="mb-3 font-display text-base font-bold text-primary dark:text-foreground">
            {bhk ? `${heading} ${bhk} Floor Plans` : `${heading} Floor Plans`}
          </h2>
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
                {/* An h3: it sits under the Floor Plans h2 and names the
                    configuration, which was the one place the page had a
                    heading's job being done by a styled div. Same classes, so
                    nothing moves. */}
                <h3 className="text-sm font-bold text-foreground">{plan.config} Floor Plan</h3>
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
            {heading} Amenities
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

      {/* Master Plan */}
      {p.layout && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-glass">
          <h2 className="mb-3 font-display text-base font-bold text-primary dark:text-foreground">Master Plan</h2>
          <button
            type="button"
            onClick={() => setZoom(p.layout!)}
            className="group relative block h-64 w-full overflow-hidden rounded-xl border border-border sm:h-96 cursor-zoom-in"
          >
            <CoverImage src={p.layout} alt={`${p.name} Master Plan`} gradient={p.gradient} sizes="(max-width:1024px) 100vw, 80vw" />
            <span className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-lg bg-black/60 px-3 py-2 text-xs font-semibold text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
              <Expand className="h-4 w-4" /> Expand Layout
            </span>
          </button>
        </div>
      )}

      {/* Location & Connectivity */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
          {/* The locality is the other half of a local search — "Sector 128",
              "NH09/NH24", "Omicron 1A" — and it is whatever the record says. */}
          <h2 className="mb-3 font-display text-base font-bold text-primary dark:text-foreground">
            {localityLabel
              ? `${heading} Location & Connectivity in ${localityLabel}`
              : `${heading} Location & Connectivity`}
          </h2>
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

      {/* About the Builder and the video tour: one card, two panes.
          These were two cards side by side, and the builder half was mostly
          empty — three short metrics under a heading, against a card of its
          own. The room that bought nothing there goes to the video instead,
          which is the half worth looking at: one border, and the wider column
          is the video's. The builder metrics sit centred against it rather
          than stranded at the top of a tall pane.

          With no video there is nothing to divide, so the card is the builder
          row running the full width — exactly as it always was. */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-glass">
        <div
          className={cn(
            "grid gap-6",
            // The video takes 60% of the row. Both tracks are `minmax(0,…)`:
            // a grid column is `auto` at its narrowest by default, so without
            // it the 16:9 poster would refuse to shrink below its intrinsic
            // width and push the builder pane out of the card.
            hasVideo &&
              "lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-8",
          )}
        >
          <div className="flex flex-col">
            <h2 className="mb-3 font-display text-base font-bold text-primary dark:text-foreground">About the Builder</h2>
            {/* Two shapes from one markup, because the pane is two different
                shapes. Beside a video it is a tall narrow column, so the
                metrics become a divided list that fills the height it has been
                given; stacked or with no video it is a wide short strip, so
                they stay the wrapped row they have always been. A prop cannot
                do this — the switch is a breakpoint, not a render. */}
            <div
              className={cn(
                "flex flex-1 flex-wrap content-center items-center gap-6",
                hasVideo &&
                  "lg:flex-col lg:flex-nowrap lg:items-stretch lg:justify-center lg:gap-0 lg:divide-y lg:divide-border",
              )}
            >
              <div className={cn("flex items-center gap-3", hasVideo && "lg:pb-4")}>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ background: p.builder.logoColor }}>
                  <Building2 className="h-6 w-6" />
                </span>
                <div className="font-display text-lg font-bold text-primary dark:text-foreground">{p.builder.name}</div>
              </div>
              {p.builder.established > 0 && (
                <Metric listed={hasVideo} value={`${new Date().getFullYear() - p.builder.established}+`} label="Years of Experience" />
              )}
              {p.builder.deliveredProjects > 0 && (
                <Metric listed={hasVideo} value={`${p.builder.deliveredProjects}+`} label="Projects Delivered" />
              )}
              {p.builder.rating > 0 && <Metric listed={hasVideo} value={p.builder.rating.toFixed(1)} label="Builder Rating" />}
            </div>
          </div>

          {/* The rule sits on this pane, so it disappears with it — on paper,
              where the video is dropped, and below `lg`, where the panes stack
              and a vertical rule would divide nothing. */}
          {hasVideo && (
            <div data-print-hide className="lg:border-l lg:border-border lg:pl-8">
              <h2 className="mb-3 font-display text-base font-bold text-primary dark:text-foreground">
                {heading} Video Tour
              </h2>
              <PropertyVideo url={p.videoUrl} title={heading} />
            </div>
          )}
        </div>
      </div>

      {/* Similar Properties. Left off the printed sheet: someone sharing a
          property is sending that property, not a page of competitors. */}
      {similar.length > 0 && (
        <div data-print-hide className="mt-6">
          <h2 className="mb-4 font-display text-xl font-extrabold text-primary dark:text-foreground">Similar Properties You May Like</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {similar.map((s) => (
              <Link key={s.id} href={propertyPath(s)} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-glass transition-transform hover:-translate-y-1">
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
        <div data-print-hide className="rounded-2xl border border-accent/30 bg-accent/10 p-5">
          <h2 className="font-display text-base font-bold text-primary dark:text-foreground">Need Expert Advice?</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Our property experts will help you find the best deal — best price, free
            site visit, detailed cost sheet and home-loan assistance.
          </p>
          <a href={`tel:${expertPhone}`}>
            <Button variant="accent" size="md" className="mt-12 w-full">
              <Phone className="h-4 w-4" /> Get a Callback
            </Button>
          </a>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Call us: {expertPhoneDisplay}</p>
        </div>
      </div>

      {/* Reviews — last block, so the buying information comes first. */}
      <PropertyReviews
        reviews={reviews}
        averageRating={reviewAvg}
        propertyName={p.name}
      />

      {/* Floor-plan lightbox */}
      {zoom && <Lightbox images={[zoom]} alt="Floor plan" onClose={() => setZoom(null)} />}

      {/* Photo gallery lightbox */}
      {photoIndex !== null && (
        <Lightbox
          images={photos}
          startIndex={photoIndex}
          alt={`${p.name} photo`}
          onClose={() => setPhotoIndex(null)}
        />
      )}
      
      <SiteVisitModal 
        isOpen={isSiteVisitOpen} 
        onClose={() => setIsSiteVisitOpen(false)} 
        propertyName={p.name} 
      />
    </div>
  );
}

/** Prev/next control overlaid on the main gallery tile. */
function GalleryArrow({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 z-[2] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full",
        "bg-white/85 text-slate-800 shadow-md backdrop-blur transition hover:bg-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        // Revealed on hover/focus on pointer devices; always visible on touch.
        "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      {side === "left" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </button>
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

/**
 * `listed` opts into the divided-list shape the builder pane takes at `lg`
 * when a video is beside it: label on the left, figure on the right, one to a
 * line. `flex-row-reverse` puts the label first without moving the figure out
 * in front of it in the DOM, where a screen reader would read the number
 * before knowing what it counts. Everywhere else — and at every width below
 * `lg` — this is the stacked figure-over-label it has always been.
 */
function Metric({ value, label, listed = false }: { value: string; label: string; listed?: boolean }) {
  return (
    <div
      className={cn(
        listed &&
          "lg:flex lg:flex-row-reverse lg:items-baseline lg:justify-between lg:gap-4 lg:py-3.5",
      )}
    >
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
