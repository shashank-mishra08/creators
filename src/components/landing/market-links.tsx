import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { builderPath, cityPath } from "@/lib/seo";

export function MarketLinks({
  cities,
  builders,
}: {
  cities: { name: string; count: number }[];
  builders: { name: string; count: number }[];
}) {
  if (cities.length === 0 && builders.length === 0) return null;

  return (
    <section className="container py-10">
      <div className="max-w-3xl">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-primary dark:text-foreground sm:text-3xl">
          Flats for sale across Noida &amp; NCR
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Creators Arena lists live residential projects in Noida Expressway,
          Greater Noida, Greater Noida West, Ghaziabad and Yamuna Expressway.
          Open a location or builder to compare price, BHK, possession and
          investment potential before you visit.
        </p>
      </div>

      {cities.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Browse by location
          </h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((c) => (
              <li key={c.name}>
                <Link
                  href={cityPath(c.name)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-glass transition-colors hover:border-accent/50 hover:bg-accent/5"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-accent" />
                    <span className="truncate font-semibold text-foreground">{c.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    {c.count} {c.count === 1 ? "project" : "projects"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {builders.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Browse by builder
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {builders.map((b) => (
              <li key={b.name}>
                <Link
                  href={builderPath(b.name)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-accent/50 hover:text-accent"
                >
                  <Building2 className="h-3.5 w-3.5 text-accent" />
                  {b.name}
                  <span className="text-xs font-medium text-muted-foreground">{b.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
