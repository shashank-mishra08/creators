import type { Metadata } from "next";
import { Suspense } from "react";
import { QuickCompareClient } from "@/components/compare-slots/quick-compare-client";

export const metadata: Metadata = {
  title: "Quick compare properties",
  description:
    "Pick up to three projects from the dropdowns and compare price, configuration, area, possession and amenities side by side.",
  alternates: { canonical: "/compare/quick" },
  openGraph: {
    title: "Quick compare properties · Creators Arena",
    description:
      "Pick up to three projects and compare price, configuration, area, possession and amenities side by side.",
    url: "/compare/quick",
  },
};

/**
 * Slot-based comparison, separate from /compare.
 *
 * /compare works off the persisted selection a visitor builds while browsing;
 * this page starts empty and is driven entirely by its own dropdowns and the
 * `?p=` query string, so the two never affect each other.
 */
export default function QuickComparePage() {
  return (
    // The client reads `?p=` via useSearchParams, which needs a Suspense
    // boundary to be safe under static rendering.
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <QuickCompareClient />
    </Suspense>
  );
}
