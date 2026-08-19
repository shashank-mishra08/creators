import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, builderPath } from "@/lib/seo";
import { getDataSource } from "@/lib/data-source";

export const metadata: Metadata = {
  title: "Builders in NCR",
  description:
    "Compare residential projects by builder — Godrej, Sobha, Eldeco, Gaurs and more across Noida and Greater Noida.",
  alternates: { canonical: "/builders" },
  openGraph: {
    title: "NCR builders · Creators Arena",
    description: "Browse live residential projects grouped by developer.",
    url: "/builders",
  },
};

export const dynamic = "force-dynamic";

export default async function BuildersIndexPage() {
  const properties = await getDataSource().list();
  const counts = new Map<string, number>();
  for (const p of properties) {
    counts.set(p.builder.name, (counts.get(p.builder.name) ?? 0) + 1);
  }
  const builders = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Builders", path: "/builders" },
            ]),
          ],
        }}
      />
      <div className="container py-12">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-primary dark:text-foreground sm:text-4xl">
          Builders with projects in NCR
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Open a developer to see every live project we list for them, then
          compare configurations, location and price against other NCR options.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {builders.map((b) => (
            <li key={b.name}>
              <Link
                href={builderPath(b.name)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-4 shadow-glass transition-colors hover:border-accent/50 hover:bg-accent/5"
              >
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-accent" />
                  {b.name}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {b.count} {b.count === 1 ? "project" : "projects"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
