/**
 * Change query params in place, without a navigation.
 *
 * `history.replaceState` rather than `router.push` or `router.replace`. Both
 * of those are navigations: Next re-runs the route's server components, which
 * on a `force-dynamic` page means re-querying the database on every keystroke.
 * Next patches the History API to notify the router, so `useSearchParams` still
 * updates from this — without the round trip.
 *
 * `replaceState` and not `pushState` so Back leaves for the previous page
 * rather than walking backwards through one history entry per character typed.
 *
 * A `null` value drops the param; an omitted key is left exactly as it was, so
 * a search box can write `q` without disturbing a status filter beside it.
 */
export function replaceParams(next: Record<string, string | null>): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(next)) {
    value === null || value === "" ? params.delete(key) : params.set(key, value);
  }

  const qs = params.toString();
  window.history.replaceState(
    null,
    "",
    qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
  );
}
