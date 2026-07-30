"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  lg: "h-7 w-7",
  md: "h-5 w-5",
  sm: "h-4 w-4",
} as const;

/**
 * Interactive 1–5 star input.
 *
 * Built as a radiogroup rather than five loose buttons so it is reachable and
 * operable from the keyboard (arrows move, Home/End jump) and announces itself
 * as one control. Clicking the current value clears it back to unrated, which
 * is the only way to undo an optional aspect score.
 */
export function StarRating({
  value,
  onChange,
  label,
  size = "md",
  clearable = true,
}: {
  value: number | null;
  onChange: (next: number | null) => void;
  /** Accessible name, e.g. "Overall rating" or "Location". */
  label: string;
  size?: keyof typeof SIZES;
  /** When false, a star press can only set a value, never unset it. */
  clearable?: boolean;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  const move = (delta: number) => {
    const next = Math.min(5, Math.max(1, (value ?? 0) + delta));
    onChange(next);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        move(1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        move(-1);
        break;
      case "Home":
        e.preventDefault();
        onChange(1);
        break;
      case "End":
        e.preventDefault();
        onChange(5);
        break;
      case "Backspace":
      case "Delete":
        if (clearable) {
          e.preventDefault();
          onChange(null);
        }
        break;
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      onMouseLeave={() => setHover(null)}
      className="inline-flex items-center gap-1"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= shown;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            // Only one stop in the tab order: the selected star, or the first.
            tabIndex={value === n || (value === null && n === 1) ? 0 : -1}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(null)}
            onClick={() => onChange(clearable && value === n ? null : n)}
            className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Star
              className={cn(
                SIZES[size],
                "transition-colors",
                filled
                  ? "fill-accent text-accent"
                  : "fill-transparent text-accent/45",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/** Read-only star row for displaying a saved rating. */
export function StarDisplay({
  value,
  size = "sm",
}: {
  value: number;
  size?: keyof typeof SIZES;
}) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={cn(
            SIZES[size],
            n <= value ? "fill-amber-400 text-amber-400" : "fill-transparent text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}
