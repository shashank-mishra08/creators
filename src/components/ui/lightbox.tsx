"use client";

import * as React from "react";
import Image from "next/image";
import { X } from "lucide-react";

/**
 * Accessible image lightbox (floor plans). Render conditionally — mounting opens
 * it. Provides dialog semantics, Escape-to-close, focus into the dialog on open,
 * focus restoration on close, a single-control focus trap and body scroll lock.
 */
export function Lightbox({
  src,
  alt = "Floor plan",
  onClose,
}: {
  src: string;
  alt?: string;
  onClose: () => void;
}) {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      // Only the close button is focusable, so keep Tab on it (focus trap).
      onKeyDown={(e) => {
        if (e.key === "Tab") {
          e.preventDefault();
          closeRef.current?.focus();
        }
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
    >
      <button
        ref={closeRef}
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="relative h-[88vh] w-[94vw]" onClick={(e) => e.stopPropagation()}>
        <Image src={src} alt={alt} fill unoptimized className="object-contain" sizes="94vw" />
      </div>
    </div>
  );
}
