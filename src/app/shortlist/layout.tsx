import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shortlist",
  robots: { index: false, follow: false },
};

export default function ShortlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
