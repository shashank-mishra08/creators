"use client";

import { create } from "zustand";

/**
 * Where the active listing search came from.
 *
 * The search box and the location picker exist twice — once in the navbar (and
 * the mobile drawer) and once in the listing toolbar — and both write the same
 * `?q=`/`?city=` params, so the URL alone cannot say which one the visitor
 * used. The home page needs to know: a search started from the navbar drops the
 * hero so the results sit directly under the bar the visitor just typed into,
 * while the toolbar is already beside the results and must not yank the page
 * out from under a half-typed query.
 *
 * A store rather than a prop or a context because the two ends live in
 * different trees: the controls are in the header rendered by the root layout,
 * the hero is in the home page's own subtree.
 *
 * Only the origin lives here. Whether a search is active at all is read from
 * the URL where it belongs — see `@/lib/listing-filters`.
 */
interface NavSearchState {
  /** True while the current search was started from the navbar controls. */
  fromNav: boolean;
  setFromNav: (fromNav: boolean) => void;
}

export const useNavSearch = create<NavSearchState>()((set) => ({
  fromNav: false,
  setFromNav: (fromNav) => set({ fromNav }),
}));
