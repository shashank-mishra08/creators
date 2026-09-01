"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { cloudinaryCover, cloudinaryLimit } from "@/lib/cloudinary";
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
    return (
      <Image
        src={
          fit
            ? fit.ratio
              ? cloudinaryCover(src, { ratio: fit.ratio, width: fit.width })
              : cloudinaryLimit(src, fit.width)
            : src
        }
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
