import type { Property } from "@/lib/types";
import type { ComparisonPayload } from "@/lib/services/comparison.service";

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

  compare(ids: string[]): Promise<ComparisonPayload> {
    const qs = ids.map((id) => `id=${encodeURIComponent(id)}`).join("&");
    return getJson<ComparisonPayload>(`/api/compare?${qs}`);
  },
};
