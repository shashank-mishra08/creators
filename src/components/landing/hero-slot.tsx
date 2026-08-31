"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { hasListingSearch } from "@/lib/listing-filters";
import { useNavSearch } from "@/store/nav-search";

/**
 * Holds the home page's hero, and takes it away while a navbar search is on.
 *
 * The listing sits below the hero, so a visitor who typed into the bar at the
 * top of the screen had to watch a full-height stage scroll past before the
 * thing they searched for appeared. With the hero out, the results start
 * directly under the bar — which is where someone who has just typed a project
 * name is already looking.
 *
 * Two conditions, not one:
 *
 *   the URL carries a search — `?q=` or `?city=`, so clearing the box anywhere
 *   brings the hero back and there is no state that can strand it hidden
 *
 *   that search came from the navbar — the listing toolbar writes the same
 *   params from a spot the visitor has already scrolled down to, and pulling
 *   the page up from under a half-typed query there would be sabotage
 *
 * A link shared with `?q=` already in it counts as the first case: the search
 * is visibly on in the navbar box the moment the page paints, so the hero is
 * dropped for that render too. `seeded` is initialised from the params rather
 * than set in an effect so the server and the first client render agree —
 * seeding after mount would hydrate the hero in and then rip it out.
 */
export function HeroSlot({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const fromNav = useNavSearch((s) => s.fromNav);
  const setFromNav = useNavSearch((s) => s.setFromNav);

  const active = hasListingSearch(searchParams);
  const [seeded, setSeeded] = React.useState(active);
  const hidden = active && (fromNav || seeded);

  // Both claims on the hero expire the moment there is no search left to
  // justify them, wherever it was cleared from — the toolbar's Clear all, the
  // little x in either box, or simply arriving back on the home page from a nav
  // link, which drops the params. Without this the flag outlives the search
  // that set it, and the next query typed into the toolbar would inherit a
  // claim it never made.
  React.useEffect(() => {
    if (active) return;
    if (seeded) setSeeded(false);
    if (fromNav) setFromNav(false);
  }, [active, seeded, fromNav, setFromNav]);

  // The hero leaves the flow the instant it is dropped, so the browser has
  // already clamped whatever scroll position was below the new page height.
  // This finishes the job for someone who searched from the sticky bar partway
  // down the listing: without it they land in the middle of a result set they
  // have not seen the top of.
  const wasHidden = React.useRef(hidden);
  React.useEffect(() => {
    if (hidden && !wasHidden.current) {
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    }
    wasHidden.current = hidden;
  }, [hidden]);

  return hidden ? null : <>{children}</>;
}
