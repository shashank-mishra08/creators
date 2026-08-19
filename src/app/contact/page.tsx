import type { Metadata } from "next";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, SITE_NAME, SITE_NAP } from "@/lib/seo";
import { settingsService } from "@/lib/services/settings.service";

export const metadata: Metadata = {
  title: "Contact",
  description: `Talk to ${SITE_NAME} in Sector 63, Noida. Site visits, project comparisons and home-loan assistance for NCR residential properties.`,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `Contact ${SITE_NAME}`,
    description: `Reach the ${SITE_NAME} desk in Noida for site visits and property comparisons.`,
    url: "/contact",
  },
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await settingsService.getPublic().catch(() => null);
  const phone = settings?.contactPhone?.trim() || SITE_NAP.phone;
  const email = settings?.contactEmail?.trim() || SITE_NAP.email;
  const address = settings?.officeAddress?.trim() || SITE_NAP.address;
  const hours = settings?.businessHours?.trim() || "";
  const mapUrl = settings?.mapUrl?.trim() || "";

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Contact", path: "/contact" },
            ]),
          ],
        }}
      />
      <article className="container max-w-3xl py-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">Contact</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-primary dark:text-foreground sm:text-4xl">
          Talk to a property expert in Noida
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Site visits, side-by-side comparisons, cost sheets and home-loan help
          for residential projects across Noida, Greater Noida, Ghaziabad and
          Yamuna Expressway.
        </p>
        <ul className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 text-sm shadow-glass">
          <li className="flex items-start gap-3">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</div>
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="font-semibold text-foreground hover:text-accent">
                {phone}
              </a>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</div>
              <a href={`mailto:${email}`} className="font-semibold text-foreground hover:text-accent">
                {email}
              </a>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Office</div>
              {mapUrl ? (
                <a href={mapUrl} target="_blank" rel="noreferrer" className="font-semibold text-foreground hover:text-accent">
                  {address}
                </a>
              ) : (
                <span className="font-semibold text-foreground">{address}</span>
              )}
            </div>
          </li>
          {hours && (
            <li className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hours</div>
                <span className="font-semibold text-foreground">{hours}</span>
              </div>
            </li>
          )}
        </ul>
      </article>
    </>
  );
}
