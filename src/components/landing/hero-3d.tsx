"use client";

import * as React from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  ArrowRight,
  Building2,
  Scale,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { cn } from "@/lib/utils";
import { propertyPath } from "@/lib/seo";

/** One property as rendered on a hero card. Built server-side in `page.tsx`. */
export type HeroCard = {
  id: string;
  slug?: string;
  name: string;
  meta: string;
  price: string;
  image: string;
  gradient: [string, string];
  score: number;
};

/** A trio of real properties: two on the deck, the top-scoring one centred. */
export type HeroSlide = { deck: [HeroCard, HeroCard]; winner: HeroCard };

/** Rotations after the initial slide. Capped so the hero settles, never loops. */
const MAX_ROTATIONS = 3;
const ROTATE_MS = 5000;

/**
 * The "verified projects" figure, from the live catalogue.
 *
 * Floored to a round ten and suffixed, so 43 projects reads "40+" — a claim
 * that stays true as projects are added or hidden, where an exact number goes
 * stale the moment one is. Under ten there is no ten to floor to without
 * printing "0+", so the exact count stands on its own.
 */
function projectsLabel(count: number): string {
  if (count < 10) return String(count);
  return `${Math.floor(count / 10) * 10}+`;
}

/**
 * Interactive 3D hero. The whole stage reacts to the cursor: a perspective
 * tilt on the deck plus per-layer parallax (different translateZ depths move by
 * different amounts). Everything is visible at rest — the motion is enhancement,
 * not a gate — so it never depends on an animation finishing to show content.
 *
 * The cards show real properties from the database (passed in as `slides`) and
 * rotate a few times before settling. With no slides the stage still renders —
 * just the ambient panel and chips — so an empty database degrades quietly.
 */
export function Hero3D({
  slides = [],
  projectCount = 0,
  active = true,
  heightClassName = "min-h-[calc(100svh-4rem)]",
  showScrollHint = true,
}: {
  slides?: HeroSlide[];
  /**
   * How many projects the catalogue holds, for the stat row. Counted server-side
   * in `page.tsx` from the same list the explorer below the fold renders, so the
   * headline figure and the grid can never disagree. Zero — or omitted — drops
   * the stat rather than claiming a number.
   */
  projectCount?: number;
  /**
   * False while the hero is parked off-screen in the showcase. Without this the
   * card rotation burns its three turns where nobody can see them, and the hero
   * is frozen by the time it slides back in. It also parks the hero's controls:
   * see `offstage` below.
   */
  active?: boolean;
  /** The showcase sizes every slide from this one, so it owns the height. */
  heightClassName?: string;
  /** Off in the showcase, where the carousel dots occupy that strip. */
  showScrollHint?: boolean;
}) {
  const stage = React.useRef<HTMLDivElement>(null);
  const [slideIdx, setSlideIdx] = React.useState(0);

  // Rotate a limited number of times, then stop. Skipped entirely when the user
  // asked for reduced motion, or when there's nothing to rotate to.
  React.useEffect(() => {
    if (!active) return;
    if (slides.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const rotations = Math.min(MAX_ROTATIONS, slides.length - 1);
    let done = 0;
    const timer = setInterval(() => {
      done += 1;
      setSlideIdx((i) => (i + 1) % slides.length);
      if (done >= rotations) clearInterval(timer);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [slides.length, active]);

  const slide = slides[slideIdx];
  // Only the first slide preloads; later ones must not compete for LCP.
  const eager = slideIdx === 0;
  const mx = useMotionValue(0); // -0.5 .. 0.5
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 110, damping: 16, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 110, damping: 16, mass: 0.5 });

  const rotateY = useTransform(sx, [-0.5, 0.5], [-22, 22]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [18, -18]);

  const onMove = (e: React.MouseEvent) => {
    const el = stage.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  // Parked off to the side of the showcase track. Its CTAs have to leave the
  // tab order and the accessibility tree the same way an off-screen banner's
  // link does — otherwise Tab lands on a button nobody can see, and the browser
  // scrolls the (overflow-hidden, but still scrollable) stage sideways to reveal
  // it, which the transform that positions the track never undoes.
  const offstage = !active;
  const parked = offstage ? -1 : undefined;

  return (
    <section
      ref={stage}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      aria-hidden={offstage}
      className={cn(
        "relative flex w-full shrink-0 basis-full items-center overflow-hidden bg-grid",
        heightClassName,
      )}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -left-32 top-10 h-[26rem] w-[26rem] rounded-full bg-accent/25 blur-[130px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[30rem] w-[30rem] rounded-full bg-primary/25 blur-[140px] dark:bg-accent/15" />

      <div className="container relative grid w-full items-center gap-10 py-10 lg:grid-cols-[1fr_1.05fr]">
        {/* Copy */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Comparison is our superpower · NCR Real Estate
          </span>

          {/* One step down from the old sizes: the hero shares a fixed-height
              stage with the banners now, and at 7xl the copy column ran past
              it on a laptop. */}
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-primary dark:text-foreground sm:text-5xl xl:text-6xl">
            Compare
            <br />
            Properties
            <br />
            <span className="text-gradient">Smarter.</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Stack homes side-by-side and let our rule-based engine score them on
            price, amenities, location, builder and ROI - the best investment, in
            minutes.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/properties" tabIndex={parked}>
              <Button variant="accent" size="lg" className="group" tabIndex={parked}>
                Start Comparing
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/properties" tabIndex={parked}>
              <Button variant="outline" size="lg" tabIndex={parked}>
                Explore Properties
              </Button>
            </Link>
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-9 gap-y-4">
            {[
              ...(projectCount > 0
                ? [{ k: projectsLabel(projectCount), v: "Verified projects" }]
                : []),
              { k: "5", v: "Scoring factors" },
              { k: "< 2 min", v: "To a decision" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="font-display text-2xl font-extrabold text-primary dark:text-foreground">
                  {s.k}
                </dt>
                <dd className="text-xs text-muted-foreground">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 3D stage */}
        <div
          className="relative mx-auto hidden h-[30rem] w-full max-w-xl lg:block"
          style={{ perspective: 1500 }}
        >
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative h-full w-full"
          >
            <Layer sx={sx} sy={sy} depth={-90} z={-60} className="left-[18%] top-[8%]">
              <GlowPanel />
            </Layer>

            {slide && (
              <>
                <Layer sx={sx} sy={sy} depth={20} z={10} className="left-[2%] top-[26%]">
                  <DeckCard
                    card={slide.deck[0]}
                    eager={eager}
                    rotate={-7}
                    float="animate-float-slow"
                  />
                </Layer>

                <Layer sx={sx} sy={sy} depth={70} z={70} className="right-[2%] top-[14%]">
                  <DeckCard
                    card={slide.deck[1]}
                    eager={eager}
                    rotate={6}
                    float="animate-float"
                  />
                </Layer>

                <Layer
                  sx={sx}
                  sy={sy}
                  depth={130}
                  z={150}
                  className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <WinnerCard card={slide.winner} eager={eager} />
                </Layer>
              </>
            )}

            <Layer sx={sx} sy={sy} depth={180} z={210} className="right-[6%] top-[2%]">
              <FloatingChip
                icon={<TrendingUp className="h-4 w-4 text-accent" />}
                title="Best Value"
                sub="scored live"
              />
            </Layer>

            {/* Mirrors the winning card's score — a fixed number here read as a
                contradiction once the cards started showing real ones. */}
            {slide && (
              <Layer sx={sx} sy={sy} depth={200} z={230} className="left-[4%] bottom-[6%]">
                <ScoreOrb value={slide.winner.score} />
              </Layer>
            )}
          </motion.div>
        </div>
      </div>

      {/* scroll hint */}
      {showScrollHint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
          <span className="animate-float text-xs font-medium tracking-wide text-muted-foreground">
            ↓ see how it works
          </span>
        </div>
      )}
    </section>
  );
}

/* A parallax layer: sits at a translateZ depth and shifts with the cursor by an
   amount proportional to `depth`, giving real 3D separation. */
function Layer({
  children,
  className,
  sx,
  sy,
  depth,
  z,
}: {
  children: React.ReactNode;
  className?: string;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  depth: number;
  z: number;
}) {
  const x = useTransform(sx, [-0.5, 0.5], [-depth, depth]);
  const y = useTransform(sy, [-0.5, 0.5], [-depth * 0.6, depth * 0.6]);
  return (
    <motion.div
      style={{ x, y, z, transformStyle: "preserve-3d" }}
      className={`absolute ${className ?? ""}`}
    >
      {children}
    </motion.div>
  );
}

function DeckCard({
  card,
  eager,
  rotate,
  float,
}: {
  card: HeroCard;
  eager: boolean;
  rotate: number;
  float: string;
}) {
  return (
    <div className={float} style={{ transform: `rotate(${rotate}deg)` }}>
      <Link href={propertyPath(card)} className="glass block w-60 overflow-hidden rounded-2xl shadow-lift">
        <div className="relative h-28 w-full">
          {/* The card is 240px wide and was being handed the stored original —
              500 to 900KB apiece, and eight of them on the home page. `fit`
              caps the delivery; no ratio, so the framing is untouched. */}
          <CoverImage
            src={card.image}
            alt={card.name}
            gradient={card.gradient}
            sizes="240px"
            priority={eager}
            fit={{ width: 680 }}
          />
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
            <Star className="h-2.5 w-2.5 fill-accent text-accent" />
            {card.score}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 p-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1 truncate text-sm font-bold">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="truncate">{card.name}</span>
            </div>
            <div className="truncate text-[11px] text-muted-foreground">{card.meta}</div>
          </div>
          <div className="shrink-0 text-sm font-extrabold text-accent">{card.price}</div>
        </div>
      </Link>
    </div>
  );
}

/* The central "winner" card — slightly larger, glowing accent ring. */
function WinnerCard({ card, eager }: { card: HeroCard; eager: boolean }) {
  return (
    <div className="animate-float-slow">
      <Link href={propertyPath(card)} className="block w-64 overflow-hidden rounded-2xl border-2 border-accent bg-card shadow-glow">
        <div className="relative h-32 w-full">
          <CoverImage
            src={card.image}
            alt={card.name}
            gradient={card.gradient}
            sizes="256px"
            priority={eager}
            fit={{ width: 680 }}
          />
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
            ★ Top pick
          </span>
        </div>
        <div className="p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-extrabold text-primary dark:text-foreground">
              {card.name}
            </div>
            <div className="shrink-0 text-sm font-extrabold text-accent">{card.price}</div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-[hsl(280_84%_68%)] transition-all duration-700"
                style={{ width: `${card.score}%` }}
              />
            </div>
            <span className="text-xs font-bold text-accent">{card.score}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

function GlowPanel() {
  return (
    <div className="h-72 w-72 rounded-[2.5rem] border border-border/60 bg-gradient-to-br from-accent/10 to-primary/5 backdrop-blur-sm" />
  );
}

function FloatingChip({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="animate-float glass-dark flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-white shadow-lift">
      {icon}
      <div className="leading-none">
        <div className="text-sm font-bold">{title}</div>
        <div className="text-[10px] opacity-70">{sub}</div>
      </div>
    </div>
  );
}

function ScoreOrb({ value }: { value: number }) {
  return (
    <div className="animate-float-slow flex h-16 w-16 items-center justify-center rounded-full border border-accent/40 bg-card shadow-glow">
      <div className="flex flex-col items-center leading-none">
        <span className="font-display text-lg font-extrabold text-accent">
          {value}
        </span>
        <span className="text-[8px] text-muted-foreground">/100</span>
      </div>
    </div>
  );
}
