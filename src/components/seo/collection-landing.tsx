import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PropertyExplorer } from "@/components/listing/property-explorer";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import type { Property } from "@/lib/types";

export function CollectionLanding({
  title,
  intro,
  path,
  crumbs,
  properties,
  faqs,
  explorerTitle,
}: {
  title: string;
  intro: string;
  path: string;
  crumbs: { name: string; path: string }[];
  properties: Property[];
  faqs: { q: string; a: string }[];
  explorerTitle: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd(crumbs),
      itemListJsonLd(title, path, properties),
      faqJsonLd(faqs),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="container pt-6">
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {crumbs.map((c, i) => (
            <span key={c.path} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              {i < crumbs.length - 1 ? (
                <Link href={c.path} className="hover:text-accent">
                  {c.name}
                </Link>
              ) : (
                <span className="font-semibold text-foreground">{c.name}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary dark:text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{intro}</p>
      </div>
      <PropertyExplorer
        initial={properties}
        variant="browse"
        title={explorerTitle}
        subtitle="Shortlist 2–4 homes and compare side-by-side."
      />
      {faqs.length > 0 && (
        <section className="container pb-16">
          <div className="rounded-2xl border border-border bg-card px-5 shadow-glass">
            {faqs.map((f) => (
              <details key={f.q} className="group border-b border-border py-3 last:border-b-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-foreground">
                  {f.q}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
