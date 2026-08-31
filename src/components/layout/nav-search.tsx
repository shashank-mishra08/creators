"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { LocationPickerButton } from "@/components/listing/location-picker";
import {
  CITY_PARAM,
  QUERY_PARAM,
  hasListingSearch,
  isListingPath,
  parseCities,
  writeListingParams,
} from "@/lib/listing-filters";
import { useNavSearch } from "@/store/nav-search";
import type { City, CityCount } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The listing search box and location picker, for use outside the listing.
 *
 * It drives the same `?q=`/`?city=` params the toolbar on the page reads, so
 * the two are one control shown twice rather than two filters competing — see
 * `@/lib/listing-filters` for why the URL is the channel.
 *
 * `cities` is passed down from the root layout rather than fetched here. This
 * component used to load them itself on mount, which meant the navbar picker
 * opened on an empty list for a second or two after the page was interactive
 * while the toolbar's identical picker opened complete — the two controls are
 * meant to be one control shown twice, and that was the one place they differed.
 *
 * Every write also records that the search came from here, which is the one
 * thing the URL cannot say — the home page drops its hero for a search started
 * in the navbar and leaves it alone for one typed into the toolbar beside the
 * results. See `@/store/nav-search`.
 */
export function ListingSearchControls({
  cities,
  stacked = false,
}: {
  cities: CityCount[];
  /** Drawer layout: full width, one control per line. */
  stacked?: boolean;
}) {
  const searchParams = useSearchParams();
  const setFromNav = useNavSearch((s) => s.setFromNav);

  /**
   * Write, then read the origin flag back off the URL `writeListingParams` has
   * just replaced. Deriving it from the address bar rather than from the value
   * in hand keeps one definition of "a search is on" — clearing the box while a
   * city is still picked is still a search, and the flag has to stay set.
   */
  const write = React.useCallback(
    (next: { q?: string; cities?: Iterable<string> }) => {
      writeListingParams(next);
      setFromNav(hasListingSearch(new URLSearchParams(window.location.search)));
    },
    [setFromNav],
  );

  const query = searchParams.get(QUERY_PARAM) ?? "";
  const cityNames = React.useMemo(() => cities.map((c) => c.name), [cities]);
  const selected = React.useMemo(
    () => new Set(parseCities(searchParams.get(CITY_PARAM)) as City[]),
    [searchParams],
  );

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center gap-2",
        stacked && "flex-col items-stretch",
      )}
    >
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => write({ q: e.target.value })}
          placeholder="Search projects, builders or locations..."
          aria-label="Search projects, builders or locations"
          className={cn(
            "w-full rounded-xl border border-border bg-card/80 pl-9 pr-9 text-sm outline-none ring-accent/40 backdrop-blur focus:ring-2",
            stacked ? "h-11" : "h-10",
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => write({ q: "" })}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <LocationPickerButton
        cities={cityNames}
        selected={selected}
        onApply={(next) => write({ cities: next })}
        count={(c) => cities.find((x) => x.name === c)?.count ?? 0}
        className={cn(
          "rounded-xl bg-card/80 backdrop-blur",
          stacked
            ? "h-11 w-full max-w-none justify-start px-3.5 text-sm"
            : "h-10 w-auto max-w-[11rem] justify-start px-3 text-xs",
        )}
      />
    </div>
  );
}

/**
 * Header slot for the controls above.
 *
 * Only on the two pages that render a listing: anywhere else there would be
 * nothing to filter, and a search box that does nothing is worse than none.
 * Below `md` the bar has no room for it — the drawer carries it there, and the
 * page's own toolbar is a few pixels further down regardless.
 */
export function NavSearch({ cities }: { cities: CityCount[] }) {
  const pathname = usePathname();
  if (!isListingPath(pathname)) return null;

  return (
    <div className="hidden min-w-0 flex-1 md:flex lg:max-w-xl">
      <ListingSearchControls cities={cities} />
    </div>
  );
}
