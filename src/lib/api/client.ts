import type { Property, PropertyOption, PropertyReview } from "@/lib/types";
import type { ComparisonPayload } from "@/lib/services/comparison.service";
import type { MyReviewsResult } from "@/lib/services/review.service";
import type { SubmitReviewInput } from "@/lib/validation/schemas";

/**
 * Thin client-side fetch helpers for the API routes. Client components use these
 * instead of importing server/DB code directly. All responses use the
 * `{ data }` envelope from `@/lib/api/http`.
 */
async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return body.data as T;
}

export const api = {
  propertiesByIds(ids: string[]): Promise<Property[]> {
    if (ids.length === 0) return Promise.resolve([]);
    const qs = ids.map((id) => `ids=${encodeURIComponent(id)}`).join("&");
    return getJson<Property[]>(`/api/properties?${qs}`);
  },

  /** Slim catalogue for property pickers — see PropertyOption. */
  propertyOptions(): Promise<PropertyOption[]> {
    return getJson<PropertyOption[]>("/api/properties?slim=1");
  },

  compare(ids: string[]): Promise<ComparisonPayload> {
    const qs = ids.map((id) => `id=${encodeURIComponent(id)}`).join("&");
    return getJson<ComparisonPayload>(`/api/compare?${qs}`);
  },

  /* ----------------------------- reviews ----------------------------- */

  /** The signed-in user's own reviews + the popularity ranking. */
  myReviews(): Promise<MyReviewsResult> {
    return getJson<MyReviewsResult>("/api/reviews");
  },

  submitReview(propertyId: string, body: SubmitReviewInput): Promise<PropertyReview> {
    return getJson<PropertyReview>(`/api/reviews/${encodeURIComponent(propertyId)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  deleteReview(id: string): Promise<{ id: string }> {
    return getJson<{ id: string }>(`/api/reviews?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  /** Uploads one photo and returns its stored URL. */
  async uploadReviewPhoto(file: File): Promise<string> {
    const body = new FormData();
    body.append("file", file);
    const { url } = await getJson<{ url: string }>("/api/review-photos", {
      method: "POST",
      body,
    });
    return url;
  },
};
