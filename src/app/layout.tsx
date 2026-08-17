import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { MotionConfig } from "framer-motion";
import { headers } from "next/headers";
import "./globals.css";
import { SITE_URL } from "@/lib/constants";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MaintenanceScreen } from "@/components/layout/maintenance-screen";
import { Toaster } from "@/components/ui/toaster";
import { AuthInit } from "@/components/auth/auth-init";
import { CompareSessionReset } from "@/components/selection/compare-session";
import { settingsService } from "@/lib/services/settings.service";
import { propertyService } from "@/lib/services/property.service";
import type { CityCount } from "@/lib/types";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const SITE_NAME = "Creators Arena";
/**
 * The browser tab shows the name and nothing else — a tab is ~25 characters
 * wide, so the longer line only ever appeared as "Creators Arena — Compare
 * Prop…". The descriptive version is kept for the share card and the search
 * snippet below, where there is room for it and it does some work.
 */
const SOCIAL_TITLE = "Creators Arena — Compare Properties Smarter";
const DEFAULT_DESCRIPTION =
  "Compare residential properties across NCR side-by-side. Price, amenities, location, builder reputation and investment potential — find the best home in minutes.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    // Page titles render as "<page> · Creators Arena"; the home title is the
    // name on its own.
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SOCIAL_TITLE,
    description: DEFAULT_DESCRIPTION,
    locale: "en_IN",
    images: [{ url: "/art/skyline.png", alt: "Creators Arena — NCR property comparison" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SOCIAL_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/art/skyline.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Maintenance mode gates the PUBLIC site only. Admin routes (identified by the
  // x-pathname header the middleware sets for /admin) always bypass it, so staff
  // can log in and turn it off. isMaintenanceMode() fails open on any error.
  const pathname = headers().get("x-pathname") ?? "";
  const isAdminRoute = pathname.startsWith("/admin");
  const maintenance = isAdminRoute ? false : await settingsService.isMaintenanceMode();

  // Public-safe settings drive the footer (contact, social, custom fields).
  // Fetched only for the public site; the footer falls back to its defaults if
  // this is null, so nothing breaks when settings are empty or unreadable.
  //
  // The header's location picker gets its cities here too, in parallel. It used
  // to fetch them itself once mounted, which left the dropdown empty for a
  // second or two after the page was otherwise usable — the toolbar's copy of
  // the same picker had its list server-rendered and opened complete, so the
  // two controls visibly disagreed. An empty list falls back to no picker
  // options rather than breaking the header.
  const [publicSettings, navCities] = await Promise.all([
    isAdminRoute ? Promise.resolve(null) : settingsService.getPublic(),
    isAdminRoute
      ? Promise.resolve<CityCount[]>([])
      : propertyService.cityCounts().catch(() => [] as CityCount[]),
  ]);

  if (maintenance) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}>
          <MaintenanceScreen />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}>
        {/* Keyboard skip link — first focusable element, revealed on focus. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lift focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <MotionConfig reducedMotion="user">
            <AuthInit />
            {/* Clears the comparison once the visitor leaves /compare, so the
                bottom tray does not follow them back to the listing. */}
            <CompareSessionReset />
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader cities={navCities} />
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <SiteFooter settings={publicSettings} />
            </div>
            <Toaster />
          </MotionConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
