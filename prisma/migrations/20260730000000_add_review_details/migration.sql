-- Per-aspect ratings and reviewer photos for the public review form.
--
-- Purely additive: six new columns on `reviews`, no drops, no type changes, no
-- other table touched. Every rating column is nullable (an aspect the reviewer
-- skipped must stay unknown, not become a 0 that drags averages down) and
-- `photos` defaults to an empty array so read paths never null-check.
--
-- IF NOT EXISTS makes this safe to re-run, and safe to apply to a database that
-- another developer may already have pushed the same schema to.
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "ratingLocation"     INTEGER;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "ratingAmenities"    INTEGER;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "ratingConstruction" INTEGER;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "ratingValue"        INTEGER;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "ratingConnectivity" INTEGER;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "photos"             TEXT[] DEFAULT ARRAY[]::TEXT[];
