import Image from "next/image";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Renders a property photo when one exists in the database, otherwise a branded
 * gradient placeholder (using the property's own gradient) with a building icon.
 * This keeps the UI honest: no stock/dummy imagery stands in for a real listing.
 *
 * Must be placed inside a `relative` parent with a defined height (uses `fill`).
 */
export function CoverImage({
  src,
  alt,
  gradient,
  sizes,
  className,
  label,
}: {
  src?: string | null;
  alt: string;
  gradient?: [string, string];
  sizes?: string;
  className?: string;
  label?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={cn("object-cover", className)}
        sizes={sizes}
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
