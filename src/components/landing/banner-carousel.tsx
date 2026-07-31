"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Banner } from "@/lib/types";

const AUTOPLAY_MS = 6000;

/**
 * Promotional strip under the hero — new launches, offers, campaigns.
 *
 * Renders nothing when there are no live banners, so the home page is byte-for-
 * byte unchanged until an admin publishes one.
 */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [idx, setIdx] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const count = banners.length;

  // Auto-advance. Paused on hover/focus, and skipped for reduced-motion users
  // and for a single banner (nothing to advance to).
  React.useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [count, paused]);

  // A banner could be unpublished while the page is open; keep the index valid.
  React.useEffect(() => {
    if (idx >= count) setIdx(0);
  }, [idx, count]);

  if (count === 0) return null;

  const go = (next: number) => setIdx((next + count) % count);

  return (
    <section
      aria-label="Featured announcements"
      aria-roledescription="carousel"
      // Full-bleed: no container gutters, so the banner spans the whole
      // viewport width the way a hero band should.
      className="w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* No rounding, border or shadow now that it reaches the viewport edges —
          all three only read as edges when there is a gutter beside them. */}
      <div className="group relative overflow-hidden bg-card">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {banners.map((b, i) => (
            <BannerSlide key={b.id} banner={b} hidden={i !== idx} eager={i === 0} />
          ))}
        </div>

        {count > 1 && (
          <>
            <CarouselButton side="left" onClick={() => go(idx - 1)} />
            <CarouselButton side="right" onClick={() => go(idx + 1)} />

            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  onClick={() => setIdx(i)}
                  aria-label={`Go to slide ${i + 1} of ${count}`}
                  aria-current={i === idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === idx
                      ? "w-5 bg-white"
                      : "w-1.5 bg-white/55 hover:bg-white/80",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function BannerSlide({
  banner,
  hidden,
  eager,
}: {
  banner: Banner;
  hidden: boolean;
  eager: boolean;
}) {
  const isVideo = banner.mediaType === "video" && banner.videoUrl;

  const content = (
    <>
      {/* Blurred copy of the artwork fills whatever the contained media doesn't,
          so a banner whose ratio differs from the slide reads as designed rather
          than letterboxed. */}
      {banner.imageUrl && (
        <Image
          src={banner.imageUrl}
          alt=""
          aria-hidden
          fill
          unoptimized
          sizes="(max-width: 1440px) 100vw, 1440px"
          className="scale-110 object-cover blur-2xl"
        />
      )}
      {isVideo ? (
        // Muted + playsInline so mobile browsers allow autoplay; the image doubles
        // as the poster so there is never a blank frame while it buffers.
        <video
          src={banner.videoUrl}
          poster={banner.imageUrl || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={banner.title || "Promotional banner"}
          className="absolute inset-0 z-[1] h-full w-full object-contain"
        />
      ) : (
        <Image
          src={banner.imageUrl}
          alt={banner.title || "Promotional banner"}
          fill
          unoptimized
          priority={eager}
          sizes="(max-width: 1440px) 100vw, 1440px"
          className="z-[1] object-contain"
        />
      )}
      {(banner.title || banner.subtitle) && (
        <>
          {/* Scrim only where text sits, so the artwork stays readable. */}
          <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-y-0 left-0 z-[3] flex max-w-[36rem] flex-col justify-center gap-1.5 p-5 sm:p-8">
            {banner.title && (
              <h2 className="font-display text-xl font-extrabold leading-tight text-white drop-shadow sm:text-3xl">
                {banner.title}
              </h2>
            )}
            {banner.subtitle && (
              <p className="line-clamp-2 text-xs text-white/85 sm:text-sm">
                {banner.subtitle}
              </p>
            )}
          </div>
        </>
      )}
    </>
  );

  // Sized by aspect ratio rather than fixed pixel heights: at 160–256px tall a
  // wide banner lost most of its artwork to the crop. `object-contain` on a
  // dark plate then guarantees nothing is ever cut, whatever ratio is uploaded
  // — banners are designed creatives, so losing an edge loses the message.
  const className =
    "relative block w-full shrink-0 basis-full bg-[#0B0718] aspect-[16/10] sm:aspect-[1600/500] lg:aspect-[1600/470]";

  // Off-screen slides stay in the track (the transform needs them) but are
  // taken out of the tab order and the accessibility tree.
  return (
    <div className={className} aria-hidden={hidden}>
      {banner.linkUrl ? (
        <Link
          href={banner.linkUrl}
          className="absolute inset-0"
          tabIndex={hidden ? -1 : undefined}
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}

function CarouselButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Previous banner" : "Next banner"}
      className={cn(
        "absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur transition-opacity hover:bg-black/60 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        "opacity-0 group-hover:opacity-100 max-lg:opacity-100",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
