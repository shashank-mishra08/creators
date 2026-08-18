"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Banner } from "@/lib/types";

/** Phones take the portrait crop, `sm` and up the wide one. Kept in step with
 *  Tailwind's `sm` breakpoint (640px) by hand — a media query string cannot be
 *  read out of the config. */
const PHONE_MEDIA = "(max-width: 639px)";

/**
 * One promotional banner, as a slide.
 *
 * Artwork is `object-contain` on a plate filled with a blurred copy of itself:
 * banners are designed creatives, so cropping an edge loses the message, and a
 * plain letterbox reads as a mistake where the blur reads as intent.
 *
 * The slide is a different shape at each end: the stage takes its height from
 * the hero, so it is roughly 390×664 on a phone and 1440×704 on a desktop. One
 * landscape creative can only fill one of those — contained in the other it
 * lands at about a third of the height, which is mostly blur. So a banner may
 * carry a second, portrait file for phones; without one the wide file is used
 * at every width, exactly as before.
 *
 * `fill` makes it take the height of whatever it is placed in — the hero
 * showcase sizes every slide from the hero, so the band cannot use its own
 * aspect ratio there.
 */
export function BannerSlide({
  banner,
  hidden,
  eager,
  fill = false,
}: {
  banner: Banner;
  hidden: boolean;
  /** Start loading the artwork immediately instead of waiting for the slide to
   *  scroll into view — a slide parked outside a clipped track never does. */
  eager: boolean;
  fill?: boolean;
}) {
  const isVideo = banner.mediaType === "video" && banner.videoUrl;
  // No phone artwork uploaded: the wide file serves both widths, which is what
  // every banner did before the field existed.
  const phone = banner.imageUrlMobile || banner.imageUrl;

  const content = (
    <>
      {banner.imageUrl && (
        <Artwork
          wide={banner.imageUrl}
          phone={phone}
          alt=""
          decorative
          eager={eager}
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
        />
      )}
      {isVideo ? (
        // Muted + playsInline so mobile browsers allow autoplay; the image
        // doubles as the poster so there is never a blank frame while it
        // buffers. A video has one file at every width — there is no <source>
        // trick for it that does not download both.
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
        <Artwork
          wide={banner.imageUrl}
          phone={phone}
          alt={banner.title || "Promotional banner"}
          eager={eager}
          className="absolute inset-0 z-[1] h-full w-full object-contain"
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

  // Off-screen slides stay in the track (the transform needs them) but are
  // taken out of the tab order and the accessibility tree.
  return (
    <div
      className={cn(
        // `overflow-hidden` because the blur layer is scaled to 110%: without
        // it the fill spills 5% into the neighbouring slide, which was
        // invisible between two dark banners but painted a dark band down the
        // edge of the hero once the two shared a track.
        "relative block w-full shrink-0 basis-full overflow-hidden bg-[#0B0718]",
        // Height comes from the flex line (the hero), not from a ratio of its
        // own — `h-full` would resolve against an auto-height parent and give 0.
        fill
          ? "self-stretch"
          : "aspect-[16/10] sm:aspect-[1600/500] lg:aspect-[1600/470]",
      )}
      aria-hidden={hidden}
    >
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

/**
 * The artwork, art-directed between phone and desktop.
 *
 * `<picture>` rather than next/image: the phone gets a *different crop* of the
 * creative, not a smaller copy of the same one, and the browser has to pick one
 * file and never fetch the other. Nothing is given up by dropping next/image
 * here — `images.unoptimized` is set project-wide (see next.config.mjs), so it
 * was only ever wrapping layout helpers around this same <img>.
 */
function Artwork({
  wide,
  phone,
  alt,
  eager,
  className,
  decorative = false,
}: {
  wide: string;
  phone: string;
  alt: string;
  eager: boolean;
  className: string;
  /** The blurred backing plate, which repeats the artwork behind it. */
  decorative?: boolean;
}) {
  return (
    // `contents` so the picture box itself never takes part in layout — the
    // <img> inside is absolutely positioned against the slide.
    <picture className="contents">
      <source media={PHONE_MEDIA} srcSet={phone} />
      {/* eslint-disable-next-line @next/next/no-img-element -- art direction:
          see the note above on why next/image cannot express this. */}
      <img
        src={wide}
        alt={alt}
        aria-hidden={decorative || undefined}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={className}
      />
    </picture>
  );
}
