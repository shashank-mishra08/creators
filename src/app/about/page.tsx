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
      <article className="container max-w-3xl py-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">About</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-primary dark:text-foreground sm:text-4xl">
          Property comparison, built for NCR buyers
        </h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <p>
            {SITE_NAME} is a RERA-registered real estate consultancy in Noida. We
            help home buyers and investors compare residential projects across
            Noida, Greater Noida, Ghaziabad and Yamuna Expressway — side by side,
            on price, amenities, location, builder reputation and investment
            potential.
          </p>
          <p>
            Most listing sites show one project at a time. Buyers still end up in
            a spreadsheet. Comparison is the product here: pick two to four live
            projects and a rule-based score explains which one fits a family,
            an investor or a luxury brief — and why.
          </p>
          <p>
            The catalogue is taken from developer intake sheets and kept current
            by the team in Noida. Every public project page carries
            configurations, floor plans, RERA details and connectivity so a site
            visit starts with facts, not a brochure.
          </p>
        </div>
        <dl className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-5 text-sm shadow-glass sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Office
            </dt>
            <dd className="mt-1 font-medium text-foreground">{address}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              RERA
            </dt>
            <dd className="mt-1 font-medium text-foreground">{rera}</dd>
          </div>
        </dl>
        <p className="mt-8 text-sm">
          <Link href="/properties" className="font-semibold text-accent hover:underline">
            Browse NCR properties
          </Link>
          {" · "}
          <Link href="/contact" className="font-semibold text-accent hover:underline">
            Contact the team
          </Link>
        </p>
      </article>
    </>
  );
}
