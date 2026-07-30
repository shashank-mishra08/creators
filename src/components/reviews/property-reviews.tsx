"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageSquareQuote, Star } from "lucide-react";
import { StarDisplay } from "@/components/reviews/star-rating";
import { Button } from "@/components/ui/button";
import { Lightbox } from "@/components/ui/lightbox";
import { REVIEW_ASPECTS, type PropertyReview } from "@/lib/types";

const PAGE = 4;

/**
 * Public reviews for one property, at the foot of its detail page.
 *
 * Shows the first few and expands on demand — reviews are long-form, and a
 * project with twenty of them should not push the rest of the page away.
 */
export function PropertyReviews({
  reviews,
  averageRating,
  propertyName,
}: {
  reviews: PropertyReview[];
  averageRating: number | null;
  propertyName: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [zoom, setZoom] = React.useState<string[] | null>(null);

  const shown = expanded ? reviews : reviews.slice(0, PAGE);

  // Per-aspect averages, counting only the reviews that scored each aspect —
  // a skipped aspect is unknown, not a zero.
  const aspectAverages = React.useMemo(
    () =>
      REVIEW_ASPECTS.map(({ key, label }) => {
        const scores = reviews
          .map((r) => r.aspects[key])
          .filter((v): v is number => v != null);
        return {
          label,
          average: scores.length
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : null,
          count: scores.length,
        };
      }).filter((a) => a.average != null),
    [reviews],
  );

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-glass">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-primary dark:text-foreground">
            <MessageSquareQuote className="h-5 w-5 text-accent" />
            Reviews
            {reviews.length > 0 && (
              <span className="text-base font-bold text-muted-foreground">
                ({reviews.length})
              </span>
            )}
          </h2>
          {averageRating != null ? (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 font-display text-lg font-extrabold text-amber-500">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {averageRating.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                average from {reviews.length}{" "}
                {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-muted-foreground">
              No reviews yet — be the first to review {propertyName}.
            </p>
          )}
        </div>

        <Link href="/shortlist?tab=review">
          <Button variant="accent" size="sm">
            <Star className="h-4 w-4" /> Write a review
          </Button>
        </Link>
      </div>

      {aspectAverages.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {aspectAverages.map((a) => (
            <li
              key={a.label}
              className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground"
            >
              {a.label}{" "}
              <span className="text-accent">{a.average!.toFixed(1)}</span>
              <span className="text-muted-foreground"> · {a.count}</span>
            </li>
          ))}
        </ul>
      )}

      {shown.length > 0 && (
        <ul className="mt-4 divide-y divide-border border-t border-border">
          {shown.map((r) => (
            <li key={r.id} className="py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                  {initialsOf(r.authorName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-foreground">
                    {r.authorName}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <StarDisplay value={r.rating} />
              </div>

              <p className="mt-2.5 whitespace-pre-line text-sm text-foreground">
                {r.comment}
              </p>

              {REVIEW_ASPECTS.some(({ key }) => r.aspects[key] != null) && (
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {REVIEW_ASPECTS.filter(({ key }) => r.aspects[key] != null).map(
                    ({ key, label }) => (
                      <li
                        key={key}
                        className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
                      >
                        {label} {r.aspects[key]}★
                      </li>
                    ),
                  )}
                </ul>
              )}

              {r.photos.length > 0 && (
                <ul className="mt-2.5 flex flex-wrap gap-2">
                  {r.photos.map((url, i) => (
                    <li key={url}>
                      <button
                        type="button"
                        onClick={() => setZoom(r.photos.slice(i).concat(r.photos.slice(0, i)))}
                        aria-label={`View photo ${i + 1} from ${r.authorName}'s review`}
                        className="block h-20 w-24 cursor-zoom-in overflow-hidden rounded-lg border border-border"
                      >
                        <Image
                          src={url}
                          alt=""
                          width={96}
                          height={80}
                          unoptimized
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {reviews.length > PAGE && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-4 text-sm font-semibold text-accent hover:underline"
        >
          {expanded
            ? "Show fewer reviews"
            : `Show all ${reviews.length} reviews`}
        </button>
      )}

      {zoom && (
        <Lightbox images={zoom} alt="Review photo" onClose={() => setZoom(null)} />
      )}
    </div>
  );
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
