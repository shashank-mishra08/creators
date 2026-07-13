import type { NextRequest } from "next/server";
import { TooManyRequestsError } from "@/lib/errors";

/**
 * Minimal in-memory fixed-window rate limiter (no external dependency).
 *
 * Scope & trade-off: state lives in this process's memory, so limits are
 * enforced PER INSTANCE. On a single long-lived Node server this is accurate;
 * on horizontally-scaled serverless the effective limit multiplies by the
 * number of live instances. It is intentionally isolated behind `rateLimit()`
 * so swapping in a shared store (Redis/Upstash) later is a one-file change.
 */

interface Bucket {
  count: number;
  resetAt: number; // epoch ms when the window rolls over
}

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the Map can't grow unbounded from unique keys/IPs.
function sweep(now: number): void {
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

/** Register one hit for `key`. Returns whether it is within `limit`/`windowMs`. */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  if (buckets.size > 5000) sweep(now); // bound memory under abuse

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterSec: 0 };
}

/** Best-effort client IP from proxy headers (Vercel/Nginx set these). */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export interface RateLimitOptions {
  /** Logical name for the limited action, e.g. "auth:login". */
  name: string;
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/**
 * Enforce a per-IP rate limit for a route; throws `TooManyRequestsError` (429)
 * when exceeded so it flows through the existing `handleError` translator.
 */
export function enforceRateLimit(req: NextRequest, opts: RateLimitOptions): void {
  const key = `${opts.name}:${getClientIp(req)}`;
  const { ok, retryAfterSec } = rateLimit(key, opts.limit, opts.windowMs);
  if (!ok) {
    throw new TooManyRequestsError(
      `Too many attempts. Please try again in ${retryAfterSec} second${
        retryAfterSec === 1 ? "" : "s"
      }.`,
    );
  }
}
