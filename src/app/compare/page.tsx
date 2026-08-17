import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareClient } from "@/components/comparison/compare-client";

export const metadata: Metadata = {
  title: "Compare properties",
  description:
    "Side-by-side comparison with a transparent, rule-based recommendation score.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Compare properties · Creators Arena",
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
