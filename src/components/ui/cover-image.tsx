"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2 } from "lucide-react";
import {
  cloudinaryCover,
  cloudinaryLimit,
  cloudinarySrcSet,
  isCloudinaryUpload,
} from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

/**
 * Renders a property photo when one exists, otherwise a branded gradient
 * placeholder (property gradient + building icon).
 *
 * If the src 404s (common when DB points at a missing /properties/*.jpg file),
 * we fall back to the placeholder instead of a broken image — and never hit the
 * dynamic /properties/[id] route as a failed static asset cascade again.
 *
 * Must be placed inside a `relative` parent with a defined height (uses `fill`).
 *
 * Pass `fit` to stop the CDN sending more image than the box can show.
 *
 * With a `ratio` the photo is cut to the box's shape before it is sent, so
 * `object-cover` has nothing left to trim — see `cloudinaryCover`. Without one
 * it is only capped in width, uncropped, which is what a drawing needs: a floor
 * plan cut to a card's shape would lose rooms off its edges.
 *
 * Omit `fit` and the image is delivered whole at its stored size, which is what
 * every caller did before and most still do.
 *
 * Given a Cloudinary photo and a `sizes` string, the picture ships as a real
 * `srcset` — one variant per width a browser might want — and that path is a
 * plain `<img>` rather than `next/image`.
 *
 * It has to be. `images.unoptimized` is set project-wide, and Next forces that
 * flag on regardless of what an individual image asks for
 * (`get-img-props`: `if (config.unoptimized) unoptimized = true`), which is
 * exactly the branch that suppresses `srcset`. So while the project keeps that
 * setting — and it should, since these files are already served by a CDN that
 * formats and compresses them — the only way a phone stops downloading the
 * 1440px desktop file is to write the `srcset` ourselves. `banner-slide.tsx`
 * reaches for a bare `<img>` for a similar reason.
 *
 * What `next/image` was contributing here was the `fill` positioning, which is
 * six inline properties, and a `<link rel=preload>` for `priority` images —
 * replaced by `fetchpriority="high"` on an eager `<img>` that sits a couple of
 * kilobytes into the body, where the preload scanner reaches it just as fast.
 *
 * Anything else — a file under `public/`, a src already carrying a
 * transformation, a caller with no `sizes` to describe its box — still goes
 * through `next/image` exactly as before.
 */
export function CoverImage({
  src,
  alt,
  gradient,
  sizes,
  className,
  label,
  priority,
  fit,
}: {
  src?: string | null;
  alt: string;
  gradient?: [string, string];
  sizes?: string;
  className?: string;
  label?: string;
  /** Preload this image (above-the-fold only — one or two per page at most). */
  priority?: boolean;
  /**
   * What the box needs. `width` is the widest it ever gets in CSS pixels — ask
   * for roughly twice that so a retina screen still has pixels to work with.
   * `ratio` crops to the box's shape; leave it out and the picture is capped in
   * width but never cropped.
   */
  fit?: { ratio?: string; width: number };
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  if (showImage && src) {
    const staticSrc = fit
      ? fit.ratio
        ? cloudinaryCover(src, { ratio: fit.ratio, width: fit.width })
        : cloudinaryLimit(src, fit.width)
      : src;

    if (sizes && isCloudinaryUpload(src)) {
      const set = cloudinarySrcSet(src, fit);
      return (
        /* Not next/image on purpose — with `images.unoptimized` set
           project-wide it cannot emit a srcset. See the note above. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={staticSrc}
          srcSet={set}
          sizes={sizes}
          alt={alt}
          // `fill`, written out. Same six properties next/image inlines, so the
          // box and the crop are pixel-identical to what this rendered before.
          style={{
            position: "absolute",
            height: "100%",
            width: "100%",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            color: "transparent",
          }}
          className={cn("object-cover", className)}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          onError={() => setFailed(true)}
        />
      );
    }

    return (
      <Image
        src={staticSrc}
        alt={alt}
        fill
        className={cn("object-cover", className)}
        sizes={sizes}
        priority={priority}
        onError={() => setFailed(true)}
        unoptimized
      />
    );
  }

  const [from, to] = gradient ?? ["#4338ca", "#7c3aed"];
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1 text-white/85",
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      role="img"
      aria-label={alt}
    >
      <Building2 className="h-7 w-7 opacity-80" />
      {label && (
        <span className="px-2 text-center text-[11px] font-semibold leading-tight">
          {label}
        </span>
      )}
    </div>
  );
}
