import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, DEFAULT_DESCRIPTION, SITE_NAME, SITE_NAP } from "@/lib/seo";
import { settingsService } from "@/lib/services/settings.service";

export const metadata: Metadata = {
  title: "About us",
  description: `Creators Arena is a Noida-based real estate consultancy. ${DEFAULT_DESCRIPTION}`,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About ${SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
    url: "/about",
  },
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const settings = await settingsService.getPublic().catch(() => null);
  const rera = settings?.reraNumber?.trim() || SITE_NAP.rera;
  const address = settings?.officeAddress?.trim() || SITE_NAP.address;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "About", path: "/about" },
            ]),
          ],
        }}
      />
      <article className="container min-h-[70vh] max-w-3xl py-12">
        <p className="text-[11px] font-bold uppercase tracking-wider text-accent">About</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-primary dark:text-foreground">
          Comparison, built for NCR buyers
        </h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            {SITE_NAME} is a RERA-registered consultancy in Noida. We help buyers
            and investors compare residential projects across Noida, Greater Noida,
            Ghaziabad and Yamuna Expressway — side by side.
          </p>
          <p>
            Pick two to four live projects and a rule-based score explains which
            one fits a family, an investor or a luxury brief — and why. Every
            public page carries configurations, floor plans, RERA details and
            connectivity so a site visit starts with facts.
          </p>
        </div>
        <dl className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-5 text-sm shadow-glass sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Office</dt>
            <dd className="mt-1 font-semibold text-foreground">{address}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">RERA</dt>
            <dd className="mt-1 font-semibold text-foreground">{rera}</dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/properties"
            className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground"
          >
            Browse properties
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Contact the team
          </Link>
        </div>
      </article>
    </>
  );
}
