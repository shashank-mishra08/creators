"use client";

import Link from "next/link";
import { Mail, MapPin, Phone, Globe, Clock, Instagram, Facebook, Linkedin, Youtube } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { usePathname } from "next/navigation";
import type { PublicSettings } from "@/lib/services/settings.service";
import type { CityCount } from "@/lib/types";
import { cityPath, SITE_NAP } from "@/lib/seo";

const QUICK_LINKS: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "/properties" },
  { label: "Compare", href: "/compare/quick" },
  { label: "Locations", href: "/locations" },
  { label: "Builders", href: "/builders" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const FALLBACK = SITE_NAP;

export function SiteFooter({
  settings,
  cities = [],
}: {
  settings?: PublicSettings | null;
  cities?: CityCount[];
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  const s = settings ?? null;
  const tagline = s?.footerTagline?.trim() || FALLBACK.tagline;
  const rera = s?.reraNumber?.trim() || FALLBACK.rera;
  const phone = s?.contactPhone?.trim() || FALLBACK.phone;
  const email = s?.contactEmail?.trim() || FALLBACK.email;
  const website = s?.websiteUrl?.trim() || FALLBACK.website;
  const address = s?.officeAddress?.trim() || FALLBACK.address;
  const hours = s?.businessHours?.trim() || "";
  const customFields = (s?.footerCustomFields ?? []).filter((f) => f.label || f.value);

  const socials = [
    { url: s?.instagramUrl?.trim(), Icon: Instagram, label: "Instagram" },
    { url: s?.facebookUrl?.trim(), Icon: Facebook, label: "Facebook" },
    { url: s?.linkedinUrl?.trim(), Icon: Linkedin, label: "LinkedIn" },
    { url: s?.youtubeUrl?.trim(), Icon: Youtube, label: "YouTube" },
  ].filter((x) => x.url);

  return (
    <footer className="mt-0 bg-primary text-primary-foreground">
      <div className="container grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="text-primary-foreground">
            {/* `dark` inverts the navy mark to white — the footer sits on bg-primary.
                max-w-full guards the ~319px grid column at the widest breakpoint. */}
            <Logo dark imageClassName="h-40 max-w-full" />
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
            {tagline}
          </p>
          <p className="mt-6 text-xs font-semibold tracking-wide text-primary-foreground/50">
            RERA REG. NO: {rera}
          </p>

          {socials.length > 0 && (
            <div className="mt-5 flex items-center gap-3">
              {socials.map(({ url, Icon, label }) => (
                <a
                  key={label}
                  href={url!}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <FooterCol title="Quick Links">
          {QUICK_LINKS.map((l) => (
            <FooterLink key={l.href} label={l.label} href={l.href} />
          ))}
        </FooterCol>

        <FooterCol title="Locations">
          {(cities.length > 0
            ? cities.map((c) => c.name)
            : ["Greater Noida West", "Noida Expressway", "Ghaziabad"]
          ).map((l) => (
            <FooterLink key={l} label={l} href={cityPath(l)} />
          ))}
        </FooterCol>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider">
            Get in touch
          </h4>
          <ul className="space-y-3 text-sm text-primary-foreground/75">
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-accent" /> {phone}
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-accent" /> {email}
            </li>
            <li className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-accent" /> {website}
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {address}
            </li>
            {hours && (
              <li className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-accent" /> {hours}
              </li>
            )}
            {customFields.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>
                  {f.label && <span className="font-medium">{f.label}: </span>}
                  {f.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-primary-foreground/55 sm:flex-row">
          <span>© {new Date().getFullYear()} Creators Arena. All rights reserved.</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/properties" className="underline-offset-2 hover:underline">
              Properties
            </Link>
            <Link href="/compare" className="underline-offset-2 hover:underline">
              Compare
            </Link>
            <span>Smart property comparison across NCR</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-bold uppercase tracking-wider">{title}</h4>
      <ul className="space-y-2.5 text-sm text-primary-foreground/75">{children}</ul>
    </div>
  );
}

function FooterLink({ label, href = "#" }: { label: string; href?: string }) {
  return (
    <li>
      <Link
        href={href}
        className="transition-colors hover:text-accent"
      >
        {label}
      </Link>
    </li>
  );
}
