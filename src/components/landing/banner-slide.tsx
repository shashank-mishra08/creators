"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Banner } from "@/lib/types";

/**
 * One promotional banner, as a slide.
 *
 * Artwork is `object-contain` on a plate filled with a blurred copy of itself:
 * banners are designed creatives, so cropping an edge loses the message, and a
 * plain letterbox reads as a mistake where the blur reads as intent.
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

  const content = (
    <>
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
        // Muted + playsInline so mobile browsers allow autoplay; the image
        // doubles as the poster so there is never a blank frame while it
        // buffers.
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
          // Fetched at render rather than preloaded: `priority` would put a
          // <link rel=preload> ahead of the hero's own image, and the hero is
          // what the visitor is actually looking at.
          loading={eager ? "eager" : "lazy"}
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
