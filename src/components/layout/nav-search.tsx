"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { LocationPickerButton } from "@/components/listing/location-picker";
import { api } from "@/lib/api/client";
import {
  CITY_PARAM,
  QUERY_PARAM,
  isListingPath,
  parseCities,
  writeListingParams,
} from "@/lib/listing-filters";
import type { City } from "@/lib/types";
import { cn } from "@/lib/utils";

type CityCount = { name: City; count: number };

/**
 * Cities for the picker, with how many projects each holds.
 *
 * The header sits in the root layout and has no property data, so this comes
 * from the slim options endpoint — the same one the compare pickers use. Only
 * fetched where the controls are actually shown, and once per mount.
 */
function useCityOptions(enabled: boolean): CityCount[] {
  const [cities, setCities] = React.useState<CityCount[]>([]);

  React.useEffect(() => {
    if (!enabled || cities.length) return;
    let cancelled = false;
    api
      .propertyOptions()
      .then((options) => {
        if (cancelled) return;
        const counts = new Map<City, number>();
        for (const o of options) {
          if (o.city) counts.set(o.city, (counts.get(o.city) ?? 0) + 1);
        }
        setCities(
          [...counts.entries()]
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      })
      // The picker just stays empty if this fails. The page's own toolbar has
      // the full list either way, so no city becomes unreachable.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled, cities.length]);

  return cities;
}

/**
 * The listing search box and location picker, for use outside the listing.
 *
 * It drives the same `?q=`/`?city=` params the toolbar on the page reads, so
 * the two are one control shown twice rather than two filters competing — see
 * `@/lib/listing-filters` for why the URL is the channel.
 */
export function ListingSearchControls({
  enabled,
  stacked = false,
}: {
  enabled: boolean;
  /** Drawer layout: full width, one control per line. */
  stacked?: boolean;
}) {
  const searchParams = useSearchParams();
  const cities = useCityOptions(enabled);

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
          onChange={(e) => writeListingParams({ q: e.target.value })}
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
            onClick={() => writeListingParams({ q: "" })}
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
        onApply={(next) => writeListingParams({ cities: next })}
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
export function NavSearch() {
  const pathname = usePathname();
  if (!isListingPath(pathname)) return null;

  return (
    <div className="hidden min-w-0 flex-1 md:flex lg:max-w-xl">
      <ListingSearchControls enabled />
    </div>
  );
}
