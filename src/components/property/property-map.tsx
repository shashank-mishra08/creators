"use client";

import * as React from "react";
import { MapPin } from "lucide-react";

/**
 * The embedded Google map, held back until the visitor is nearly at it.
 *
 * `loading="lazy"` on the iframe was already there and does not work here. On
 * a desktop viewport Chrome's lazy threshold is generous enough that a map
 * sitting 2,300–2,900px down the page still counts as "near the viewport", so
 * every property page paid for the embed on load whether or not anyone
 * scrolled: 16 requests and about 427KB of Google Maps before the visitor had
 * moved. On a phone the same attribute does hold the map back, which is what
 * makes this a desktop problem rather than a broken attribute.
 *
 * An observer, not the click-to-load `PropertyVideo` uses: a video is
 * something you decide to play, and a map is something you look at. Asking for
 * a click here would trade bytes for a step the visitor did not have before.
 * The margin below means the embed starts loading while it is still off-screen,
 * so scrolling down to it looks the same as it always did.
 *
 * Renders the iframe outright where there is no observer to use — a stale
 * browser gets the old behaviour rather than a permanent grey panel.
 */
export function PropertyMap({
  query,
  title,
  className,
}: {
  /** Already URI-encoded — the same string the "View on Google Maps" link uses. */
  query: string;
  /** Property name, for the iframe's accessible title. */
  title: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (show) return;
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      // Far enough ahead that the map is drawn by the time it is scrolled to,
      // near enough that a visitor who never reaches it never pays for it.
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);

  return (
    // Same box either way, so nothing moves when the iframe takes over.
    <div ref={ref} className={className} data-map-slot>
      {show ? (
        <iframe
          title={`Map of ${title}`}
          src={`https://www.google.com/maps?q=${query}&output=embed`}
          className="h-full min-h-[16rem] w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-full min-h-[16rem] w-full items-center justify-center bg-muted/40"
        >
          <MapPin className="h-6 w-6 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}
