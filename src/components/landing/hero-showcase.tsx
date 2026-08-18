"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Hero3D, type HeroSlide } from "@/components/landing/hero-3d";
import { BannerSlide } from "@/components/landing/banner-slide";
import type { Banner } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The top of the home page: the hero and the promotional banners in one
 * rotating stage, rather than a hero with a strip pinned under it.
 *
 * Every slide is the same height, and the hero sets it — a banner is a 1920×560
 * creative, so a fixed pixel height would either crop it or leave the hero
 * cramped at some breakpoint. Sizing from the hero means the two agree at every
 * width without a table of magic numbers.
 */

/** How long each slide holds. The hero has more to read, so it holds longer. */
const HERO_MS = 7000;
const BANNER_MS = 5000;

/** Matches the slide transition below; nothing else should assume it. */
const SLIDE_MS = 700;

/** Chosen with the client: tall enough for the hero's copy and card stage,
 *  short enough that a wide banner is not lost in blurred fill. */
// The padding keeps the hero's own copy clear of the dots, which sit inside
// the stage now rather than under a separate banner strip.
const STAGE_HEIGHT =
  "min-h-[36rem] pb-16 sm:min-h-[40rem] sm:pb-12 lg:min-h-[44rem]";

export function HeroShowcase({
  slides = [],
  banners = [],
  projectCount = 0,
}: {
  slides?: HeroSlide[];
  banners?: Banner[];
  /** Passed straight through to the hero's stat row. */
  projectCount?: number;
}) {
  const count = 1 + banners.length;
  const [idx, setIdx] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  // A banner can be unpublished while the page is open.
  React.useEffect(() => {
    if (idx >= count) setIdx(0);
  }, [idx, count]);

  // Autoplay. Loops rather than settling — the point of the change is that the
  // banners get seen, and a stage that stops leaves whoever arrives late on
  // whatever slide it happened to end on.
  React.useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(
      () => setIdx((i) => (i + 1) % count),
      idx === 0 ? HERO_MS : BANNER_MS,
    );
    return () => clearTimeout(t);
  }, [idx, count, paused]);

  const go = React.useCallback(
    (next: number) => setIdx((next + count) % count),
    [count],
  );

  // Swipe. The stage is the first thing on a phone, where there are no hover
  // arrows to find.
  const touchX = React.useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchX.current;
    touchX.current = null;
    if (start == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1));
  };

  const single = count < 2;

  return (
    <section
      aria-label="Featured"
      aria-roledescription={single ? undefined : "carousel"}
      className="group relative w-full overflow-hidden"
      // Pointer events with a mouse guard, not mouseenter/mouseleave: a tap
      // synthesises a mouseenter with no matching mouseleave, so on a phone the
      // stage used to pause on the first tap and never resume. Touch has the
      // swipe instead.
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setPaused(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setPaused(false);
      }}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={(e) => {
        if (single) return;
        if (e.key === "ArrowRight") go(idx + 1);
        if (e.key === "ArrowLeft") go(idx - 1);
      }}
    >
      {/* `items-stretch` is what hands the hero's height to the banners. */}
      <div
        className="flex items-stretch ease-out"
        style={{
          transform: `translateX(-${idx * 100}%)`,
          transition: `transform ${SLIDE_MS}ms`,
        }}
      >
        <Hero3D
          slides={slides}
          projectCount={projectCount}
          active={idx === 0}
          heightClassName={STAGE_HEIGHT}
          showScrollHint={single}
        />
        {banners.map((b, i) => (
          <BannerSlide
            key={b.id}
            banner={b}
            hidden={idx !== i + 1}
            // Only the first banner, and only enough to have it decoded before
            // the stage rotates onto it: lazy would leave the dark plate bare
            // for the length of the slide, because a slide parked outside a
            // clipped track never intersects the viewport. The rest wait, so
            // nothing races the hero — the LCP element — for bandwidth.
            eager={i === 0}
            fill
          />
        ))}
      </div>

      {!single && (
        <>
          <StageButton side="left" onClick={() => go(idx - 1)} />
          <StageButton side="right" onClick={() => go(idx + 1)} />

          {/* The dots sit on a pale hero and on dark artwork by turns, so they
              carry their own backdrop — a single colour was invisible on one
              slide or the other. */}
          <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center">
            <div className="flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-2 backdrop-blur">
              {Array.from({ length: count }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={
                    i === 0 ? "Go to the intro" : `Go to banner ${i} of ${count - 1}`
                  }
                  aria-current={i === idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === idx ? "w-5 bg-white" : "w-1.5 bg-white/55 hover:bg-white/80",
                  )}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function StageButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous slide" : "Next slide"}
      className={cn(
        // On a phone the copy reaches the middle of the stage, so the arrows drop
        // to sit beside the dots instead of over the headline.
        "absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/35 p-2 text-white backdrop-blur transition-opacity hover:bg-black/60 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        "opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 max-lg:opacity-100",
        "max-sm:top-auto max-sm:bottom-3 max-sm:translate-y-0",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
