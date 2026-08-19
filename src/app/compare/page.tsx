import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareClient } from "@/components/comparison/compare-client";

export const metadata: Metadata = {
  title: "Compare NCR properties side-by-side",
  description:
    "Compare 2–4 Noida and Greater Noida projects on price, amenities, location, builder reputation and ROI with a transparent recommendation score.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Compare NCR properties · Creators Arena",
    description:
      "Side-by-side comparison with a transparent, rule-based recommendation score.",
    url: "/compare",
  },
};

export default function ComparePage() {
  // The client reads `?p=` from a shared link, which needs a Suspense boundary.
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <CompareClient />
    </Suspense>
  );
}
