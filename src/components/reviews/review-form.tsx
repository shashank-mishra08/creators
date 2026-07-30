"use client";

import * as React from "react";
import Image from "next/image";
import { Camera, CheckCircle2, Loader2, Star, Trash2, X } from "lucide-react";
import { StarRating } from "@/components/reviews/star-rating";
import { PropertySearchSelect } from "@/components/reviews/property-search-select";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import {
  REVIEW_COMMENT_MAX,
  REVIEW_PHOTO_MAX,
  REVIEW_PHOTO_MAX_MB,
} from "@/lib/constants";
import { REVIEW_ASPECTS, type PropertyOption, type ReviewAspects } from "@/lib/types";
import { cn } from "@/lib/utils";

const EMPTY_ASPECTS: ReviewAspects = {
  location: null,
  amenities: null,
  construction: null,
  value: null,
  connectivity: null,
};

/**
 * "Add a Review" — property picker, overall rating, free text, optional aspect
 * scores and optional photos.
 *
 * Photos upload as soon as they are chosen, so submitting only sends URLs. That
 * keeps the review POST small and lets an upload failure surface next to the
 * file that caused it instead of failing the whole submission at the end.
 */
export function ReviewForm({
  popularIds,
  onSubmitted,
}: {
  popularIds: string[];
  /** Called after a successful save so the parent can refresh its list. */
  onSubmitted: () => void;
}) {
  const [property, setProperty] = React.useState<PropertyOption | null>(null);
  const [rating, setRating] = React.useState<number | null>(null);
  const [comment, setComment] = React.useState("");
  const [aspects, setAspects] = React.useState<ReviewAspects>(EMPTY_ASPECTS);
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setProperty(null);
    setRating(null);
    setComment("");
    setAspects(EMPTY_ASPECTS);
    setPhotos([]);
    setError(null);
    setUploadError(null);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const room = REVIEW_PHOTO_MAX - photos.length;
    if (room <= 0) {
      setUploadError(`You can attach up to ${REVIEW_PHOTO_MAX} photos.`);
      return;
    }
    const chosen = Array.from(files).slice(0, room);
    if (files.length > room) {
      setUploadError(`Only ${room} more photo${room === 1 ? "" : "s"} can be added.`);
    }

    setUploading(true);
    try {
      // Sequential, not parallel: the endpoint is rate limited per IP, and a
      // burst of four is exactly the shape that would trip it.
      for (const file of chosen) {
        const url = await api.uploadReviewPhoto(file);
        setPhotos((prev) => [...prev, url]);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      // Clear the input so re-picking the same file fires a change event.
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async () => {
    setError(null);
    if (!property) return setError("Please choose the property you want to review.");
    if (!rating) return setError("Please give an overall rating.");
    if (comment.trim().length === 0) return setError("Please write your review.");

    setSaving(true);
    try {
      await api.submitReview(property.id, {
        rating,
        comment: comment.trim(),
        aspects,
        photos,
      });
      setDone(true);
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your review.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-glass">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <h2 className="mt-4 font-display text-xl font-extrabold text-primary dark:text-foreground">
          Thanks — your review is live
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          It now counts towards {property?.name ?? "the project"}&apos;s rating and
          appears in “Your reviews” below.
        </p>
        <Button
          variant="accent"
          size="md"
          className="mt-6"
          onClick={() => {
            reset();
            setDone(false);
          }}
        >
          Write another review
        </Button>
      </div>
    );
  }

  const counterOver = comment.length > REVIEW_COMMENT_MAX;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-glass">
      <div className="border-b border-border p-5 sm:p-6">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-extrabold text-primary dark:text-foreground sm:text-3xl">
          <Star className="h-6 w-6 fill-accent text-accent" />
          Add a Review
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Share your experience and help others make informed decisions.
        </p>
      </div>

      {/* Two columns on desktop — property + free text on the left, the ratings
          and photos on the right — placed by explicit grid cells rather than by
          source order, so a phone still reads the steps 1, 2, 3, 4, 5 top to
          bottom while the desktop layout matches the design. */}
      <div className="grid items-start gap-6 p-5 sm:p-6 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-7">
        {/* ── 1. property ─────────────────────────────────────────────── */}
        <section className="lg:col-start-1 lg:row-start-1">
          <SectionHead n={1} title="Select a Property to Review" hint="Search and choose the property you want to review." />
          <div className="mt-3">
            <PropertySearchSelect
              value={property}
              onChange={setProperty}
              popularIds={popularIds}
            />
          </div>
        </section>

        {/* ── 2. overall rating ───────────────────────────────────────── */}
        <section className="lg:col-start-2 lg:row-start-1">
          <SectionHead n={2} title="Overall Rating" hint="Click on a star to rate" />
          <div className="mt-3 flex items-center gap-3">
            <StarRating value={rating} onChange={setRating} label="Overall rating" size="lg" />
            {rating != null && (
              <span className="text-sm font-bold text-accent">{rating}.0 / 5</span>
            )}
          </div>
        </section>

        {/* ── 3. free text ────────────────────────────────────────────── */}
        <section className="lg:col-start-1 lg:row-start-2 lg:row-span-2">
          <SectionHead
            n={3}
            title="Your Review"
            hint="Share your experience about this property, location, amenities, construction quality, etc."
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, REVIEW_COMMENT_MAX))}
            maxLength={REVIEW_COMMENT_MAX}
            rows={8}
            placeholder="Write your review here……"
            aria-label="Your review"
            className="mt-3 w-full resize-y rounded-xl border border-border bg-background p-3.5 text-sm outline-none ring-accent/30 placeholder:text-muted-foreground focus:ring-2"
          />
          <div
            className={cn(
              "mt-1 text-right text-xs",
              counterOver ? "font-semibold text-danger" : "text-muted-foreground",
            )}
          >
            {comment.length}/{REVIEW_COMMENT_MAX} characters
          </div>
        </section>

        {/* ── 4. aspects ──────────────────────────────────────────────── */}
        <section className="lg:col-start-2 lg:row-start-2">
          <SectionHead
            n={4}
            title="Rate on specific aspects"
            optional
            hint="Help others by rating key aspects of this property."
          />
          <ul className="mt-3 space-y-1">
            {REVIEW_ASPECTS.map(({ key, label }) => (
              <li
                key={key}
                className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5"
              >
                <span className="text-sm font-bold text-foreground">{label}</span>
                <StarRating
                  value={aspects[key]}
                  onChange={(v) => setAspects((prev) => ({ ...prev, [key]: v }))}
                  label={label}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* ── 5. photos ───────────────────────────────────────────────── */}
        <section className="lg:col-start-2 lg:row-start-3">
          <SectionHead
            n={5}
            title="Add Photos"
            optional
            hint="Upload photos of the property or surroundings."
          />

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="sr-only"
            id="review-photos"
          />
          <label
            htmlFor="review-photos"
            className={cn(
              "mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-4 transition-colors hover:border-accent hover:bg-accent/5",
              (uploading || photos.length >= REVIEW_PHOTO_MAX) &&
                "pointer-events-none opacity-60",
            )}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
              ) : (
                <Camera className="h-5 w-5 text-muted-foreground" />
              )}
            </span>
            <span>
              <span className="block text-sm font-bold text-foreground">
                {uploading
                  ? "Uploading…"
                  : photos.length >= REVIEW_PHOTO_MAX
                    ? "Photo limit reached"
                    : "Upload Images"}
              </span>
              <span className="block text-xs text-muted-foreground">
                JPG, PNG up to {REVIEW_PHOTO_MAX_MB}MB each · max {REVIEW_PHOTO_MAX}
              </span>
            </span>
          </label>

          {uploadError && (
            <p className="mt-2 text-xs font-semibold text-danger">{uploadError}</p>
          )}

          {photos.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {photos.map((url) => (
                <li key={url} className="relative">
                  <span className="block h-16 w-20 overflow-hidden rounded-lg border border-border">
                    <Image
                      src={url}
                      alt=""
                      width={80}
                      height={64}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <button
                    type="button"
                    onClick={() => setPhotos((p) => p.filter((u) => u !== url))}
                    aria-label="Remove photo"
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── actions ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-end sm:p-6">
        {error && (
          <p
            role="alert"
            className="flex-1 text-sm font-semibold text-danger sm:text-left"
          >
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <Button variant="outline" size="md" onClick={reset} disabled={saving}>
            Cancel
          </Button>
          <Button variant="accent" size="md" onClick={submit} disabled={saving || uploading}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionHead({
  n,
  title,
  hint,
  optional,
}: {
  n: number;
  title: string;
  hint: string;
  optional?: boolean;
}) {
  return (
    <div>
      <h2 className="text-sm font-bold text-foreground">
        {n}. {title}
        {optional && (
          <span className="ml-1.5 font-medium text-muted-foreground">(Optional)</span>
        )}
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

/** One saved review, as shown in the "Your reviews" list under the form. */
export function MyReviewCard({
  review,
  onDeleted,
}: {
  review: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    photos: string[];
    propertyName: string;
    propertyLocality: string;
    propertyImage: string;
    aspects: ReviewAspects;
  };
  onDeleted: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.deleteReview(review.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
      setBusy(false);
    }
  };

  const scored = REVIEW_ASPECTS.filter(({ key }) => review.aspects[key] != null);

  return (
    <li className="rounded-2xl border border-border bg-card p-4 shadow-glass">
      <div className="flex items-start gap-3">
        <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
          {review.propertyImage && (
            <Image
              src={review.propertyImage}
              alt=""
              fill
              unoptimized
              sizes="64px"
              className="object-cover"
            />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-foreground">
            {review.propertyName}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {review.propertyLocality} ·{" "}
            {new Date(review.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>
        <span className="shrink-0 rounded-lg bg-accent/10 px-2 py-1 text-xs font-bold text-accent">
          {review.rating}.0 ★
        </span>
        <button
          onClick={remove}
          disabled={busy}
          aria-label="Delete this review"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm text-foreground">{review.comment}</p>

      {scored.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {scored.map(({ key, label }) => (
            <li
              key={key}
              className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
            >
              {label} {review.aspects[key]}★
            </li>
          ))}
        </ul>
      )}

      {review.photos.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {review.photos.map((url) => (
            <li key={url} className="h-16 w-20 overflow-hidden rounded-lg border border-border">
              <Image
                src={url}
                alt=""
                width={80}
                height={64}
                unoptimized
                className="h-full w-full object-cover"
              />
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-2 text-xs font-semibold text-danger">{error}</p>}
    </li>
  );
}
