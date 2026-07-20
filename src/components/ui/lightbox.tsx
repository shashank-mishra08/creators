"use client";

import * as React from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Accessible image lightbox. Render conditionally — mounting opens it. Provides
 * dialog semantics, Escape-to-close, focus into the dialog on open, focus
 * restoration on close, a focus trap and body scroll lock.
 *
 * Pass more than one image to get prev/next controls, arrow-key navigation and
 * a counter. A single image renders without any of that chrome.
 */
export function Lightbox({
  images,
  startIndex = 0,
  alt = "Image",
  onClose,
}: {
  images: string[];
  startIndex?: number;
  alt?: string;
  onClose: () => void;
}) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [index, setIndex] = React.useState(startIndex);

  const count = images.length;
  const multiple = count > 1;

  // Wrap around so the arrows never dead-end.
  const go = React.useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count]
  );

  React.useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (!multiple) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose, go, multiple]);

  // Keep Tab cycling inside the dialog rather than reaching the page behind it.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const nodes = dialogRef.current?.querySelectorAll<HTMLElement>("button");
    if (!nodes?.length) return;
    const list = Array.from(nodes);
    const pos = list.indexOf(document.activeElement as HTMLElement);
    const next = e.shiftKey
      ? list[(pos - 1 + list.length) % list.length]
      : list[(pos + 1) % list.length];
    e.preventDefault();
    next.focus();
  };

  const arrowClass =
    "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
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

      {multiple && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className={`${arrowClass} left-3 sm:left-6`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className={`${arrowClass} right-3 sm:right-6`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <span className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {index + 1} / {count}
          </span>
        </>
      )}

      <div className="relative h-[88vh] w-[94vw]" onClick={(e) => e.stopPropagation()}>
        <Image
          src={images[index]}
          alt={multiple ? `${alt} ${index + 1} of ${count}` : alt}
          fill
          unoptimized
          className="object-contain"
          sizes="94vw"
        />
      </div>
    </div>
  );
}
