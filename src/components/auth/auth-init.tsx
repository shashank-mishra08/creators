"use client";

import * as React from "react";
import { useAuth } from "@/store/auth";
import { useComparison } from "@/store/comparison";
import { takePendingAction } from "@/lib/pending-action";

/**
 * Restores the session (calls /api/auth/me) once on app load, and — once the
 * user is authenticated — replays any action a guest attempted before being
 * sent to log in (shortlist / save comparison), so it completes automatically.
 * Renders nothing.
 */
export function AuthInit() {
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);

  React.useEffect(() => {
    useAuth.getState().hydrate();
  }, []);

  React.useEffect(() => {
    if (!ready || !user) return;
    const action = takePendingAction();
    if (!action) return;

    if (action.type === "shortlist") {
      const { savedIds, toggleShortlist } = useAuth.getState();
      if (!savedIds.includes(action.propertyId)) {
        toggleShortlist(action.propertyId);
        useComparison.getState().setToast("Saved to your shortlist.");
      }
    } else if (action.type === "saveComparison") {
      fetch("/api/saved-comparisons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyIds: action.propertyIds }),
      })
        .then((r) => {
          if (r.ok) useComparison.getState().setToast("Comparison saved.");
        })
        .catch(() => {});
    }
    // Fires when the user transitions to authenticated; the action is one-shot.
  }, [ready, user]);

  return null;
}
