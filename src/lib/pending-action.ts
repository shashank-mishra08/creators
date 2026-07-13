/**
 * A user-specific action a guest tried to perform before authenticating. It's
 * stashed in sessionStorage before redirecting to /login and replayed once the
 * session is established (see AuthInit), so the action completes automatically.
 */
export type PendingAction =
  | { type: "shortlist"; propertyId: string }
  | { type: "saveComparison"; propertyIds: string[] };

const KEY = "ca_pending_action";

export function setPendingAction(action: PendingAction): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(action));
  } catch {
    /* storage unavailable — the redirect still happens, just no auto-replay */
  }
}

/** Reads and clears the pending action (one-shot). */
export function takePendingAction(): PendingAction | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as PendingAction;
  } catch {
    return null;
  }
}
