import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { cityPath } from "@/lib/seo";

/** Compact location strip under the hero — links, not a keyword dump. */
export function MarketLinks({
  cities,
}: {
  cities: { name: string; count: number }[];
}) {
  if (cities.length === 0) return null;

  return (
    <section className="container pb-8 pt-10">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-lg font-bold tracking-tight text-primary dark:text-foreground">
          Browse by location
        </h2>
        <Link
          href="/locations"
          className="hidden text-sm font-semibold text-accent hover:underline sm:inline"
        >
          All locations
        </Link>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cities.map((c) => (
          <li key={c.name}>
            <Link
              href={cityPath(c.name)}
              className="group flex h-full flex-col justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-4 shadow-glass transition-transform hover:-translate-y-0.5 hover:border-accent/40"
            >
              <span className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="font-semibold leading-snug text-foreground">{c.name}</span>
              </span>
              <span className="flex items-center justify-between text-xs text-muted-foreground">
                {c.count} {c.count === 1 ? "project" : "projects"}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
