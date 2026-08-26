"use client";

import * as React from "react";
import { Play, X } from "lucide-react";
import { parseVideoSource, type VideoSource } from "@/lib/video";
import { cn } from "@/lib/utils";

/**
 * A property's walkthrough video: a still that opens a player when clicked.
 *
 * Nothing about the video is loaded until it is opened — no YouTube iframe, no
 * media file. An unopened video costs a single thumbnail image, or for an
 * uploaded file the few kilobytes of metadata a browser needs to draw its first
 * frame. That matters here because this sits low on a page that already carries
 * a gallery, floor plans and a map.
 *
 * Renders nothing at all when the stored URL is not one it can play, so a typo
 * in the admin field leaves the page exactly as it was rather than showing a
 * grey box where a video should be.
 */
export function PropertyVideo({
  url,
  title,
  className,
}: {
  url: string;
  /** Property name, for the dialog label and the poster's alt text. */
  title: string;
  className?: string;
}) {
  const source = React.useMemo(() => parseVideoSource(url), [url]);
  const [open, setOpen] = React.useState(false);

  if (!source) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Play the video tour of ${title}`}
        className={cn(
          "group relative block w-full overflow-hidden rounded-xl border border-border bg-[#0B0718] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          className,
        )}
      >
        <Poster source={source} title={title} />

        {/* Scrim, so the play button reads against a bright frame too. */}
        <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-primary shadow-lift transition-transform group-hover:scale-110">
            <Play className="ml-0.5 h-6 w-6 fill-current" />
          </span>
        </span>
        <span className="absolute bottom-2 left-3 text-xs font-semibold text-white drop-shadow">
          Video tour
        </span>
      </button>

      {open && <VideoDialog source={source} title={title} onClose={() => setOpen(false)} />}
    </>
  );
}

/**
 * The still.
 *
 * YouTube publishes one, so it is used directly. An uploaded file has none, so
 * the <video> element draws its own first frame — `preload="metadata"` fetches
 * only enough for that, never the whole file.
 */
function Poster({ source, title }: { source: VideoSource; title: string }) {
  if (source.kind === "youtube") {
    return (
      /* i.ytimg.com is not in next.config's remotePatterns, and images are
         unoptimized project-wide, so next/image would only mean allow-listing
         a domain for no benefit. */
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={source.posterUrl}
        alt={`Video tour of ${title}`}
        loading="lazy"
        decoding="async"
        className="aspect-video w-full object-cover"
      />
    );
  }
  return (
    <video
      src={source.url}
      preload="metadata"
      muted
      playsInline
      aria-label={`Video tour of ${title}`}
      className="aspect-video w-full object-cover"
    />
  );
}

/**
 * The expanded player. Mirrors `@/components/ui/lightbox`: dialog semantics,
 * Escape to close, focus moved in and restored on close, Tab kept inside, and
 * the page behind it locked from scrolling.
 */
function VideoDialog({
  source,
  title,
  onClose,
}: {
  source: VideoSource;
  title: string;
  onClose: () => void;
}) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  // Only the close button is focusable outside the player, so Tab simply stays
  // on it; the player's own controls are inside the iframe or the video element.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    closeRef.current?.focus();
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Video tour of ${title}`}
      onClick={onClose}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
    >
      <button
        ref={closeRef}
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-xl bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        {source.kind === "youtube" ? (
          <iframe
            src={source.embedUrl}
            title={`Video tour of ${title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        ) : (
          // eslint-disable-next-line jsx-a11y/media-has-caption -- a walkthrough
          // has no dialogue to caption; the property's own text is on the page.
          <video
            src={source.url}
            controls
            autoPlay
            playsInline
            className="h-full w-full"
          />
        )}
      </div>
    </div>
  );
}
