import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Creators Arena logo — uses the official navy brand asset.
 * On dark backgrounds the image is rendered with a white container
 * so the navy mark remains visible; pass `dark` to opt-in.
 */
export function Logo({
  className,
  imageClassName,
  showWord = true,
  dark = false,
}: {
  className?: string;
  imageClassName?: string;
  /** When true the text/icon renders white (for dark hero backgrounds). */
  showWord?: boolean;
  dark?: boolean;
}) {
  if (showWord) {
    return (
      <span className={cn("inline-flex items-center", className)}>
        <Image
          src="/brand/creators-logo.png"
          alt="Creators Arena"
          width={320}
          height={200}
          // No `priority`. It put a `<link rel=preload as=image>` for this file
          // in the head of every page on the site, and the logo is never the
          // LCP — the property pages' is the hero, the listing's is the first
          // card, the home page's is a line of text. The preload was spending
          // the first of the connection on 56KB that nothing was waiting for.
          // The mark still sits in the initial viewport, so the browser fetches
          // it immediately either way; only the head-of-queue claim is gone.
          className={cn(
            "h-28 w-auto object-contain mt-4",
            dark && "brightness-0 invert",
            imageClassName
          )}
        />
      </span>
    );
  }

  // Icon-only fallback (used in tiny spots)
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src="/brand/creators-logo.png"
        alt="Creators Arena"
        width={60}
        height={60}
        className={cn(
          "h-14 w-14 object-contain",
          dark && "brightness-0 invert"
        )}
      />
    </span>
  );
}
