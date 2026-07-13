import Link from "next/link";
import { Mail, MapPin, Phone, Globe } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const QUICK_LINKS = [
  "Home",
  "About Us",
  "Residential",
  "Commercial",
  "Services",
  "Careers",
  "Blog",
];
const LOCATIONS = [
  "Noida",
  "Delhi",
  "Gurugram",
  "Greater Noida",
  "Greater Noida West",
];

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="container grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="text-primary-foreground">
            <Logo />
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
            At Creators Arena, we don&apos;t just close deals — we help you find
            the perfect space to grow, live, or build your dreams. Your gateway
            to smart property decisions.
          </p>
          <p className="mt-6 text-xs font-semibold tracking-wide text-primary-foreground/50">
            RERA REG. NO: UPRERAAGT0000827072025
          </p>
        </div>

        <FooterCol title="Quick Links">
          {QUICK_LINKS.map((l) => (
            <FooterLink key={l} label={l} />
          ))}
        </FooterCol>

        <FooterCol title="Locations">
          {LOCATIONS.map((l) => (
            <FooterLink key={l} label={l} href="/properties" />
          ))}
        </FooterCol>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider">
            Get in touch
          </h4>
          <ul className="space-y-3 text-sm text-primary-foreground/75">
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-accent" /> +91-9891321123
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-accent" /> contact@creatorshome.in
            </li>
            <li className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-accent" /> www.creatorshome.in
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> E-219,
              2nd Floor, Sector 63, Noida 201301
            </li>
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
