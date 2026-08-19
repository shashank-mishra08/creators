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
  const tel = phone.replace(/[^\d+]/g, "");

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
      <article className="container min-h-[70vh] max-w-3xl py-12">
        <p className="text-[11px] font-bold uppercase tracking-wider text-accent">Contact</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-primary dark:text-foreground">
          Talk to a property expert
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Site visits, comparisons, cost sheets and home-loan help for projects
          across Noida and Greater Noida.
        </p>
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-glass">
          <li className="flex items-start gap-3 p-5">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Phone</div>
              <a href={`tel:${tel}`} className="font-semibold text-foreground hover:text-accent">{phone}</a>
            </div>
          </li>
          <li className="flex items-start gap-3 p-5">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email</div>
              <a href={`mailto:${email}`} className="font-semibold text-foreground hover:text-accent">{email}</a>
            </div>
          </li>
          <li className="flex items-start gap-3 p-5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Office</div>
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
            <li className="flex items-start gap-3 p-5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Hours</div>
                <span className="font-semibold text-foreground">{hours}</span>
              </div>
            </li>
          )}
        </ul>
      </article>
    </>
  );
}
