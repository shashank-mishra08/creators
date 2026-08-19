import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { DirectoryIndex } from "@/components/seo/directory-index";
import { builderPath } from "@/lib/seo";
import { getDataSource } from "@/lib/data-source";

export const metadata: Metadata = {
  title: "Builders in NCR",
  description:
    "Compare residential projects by builder — Godrej, Sobha, Eldeco, Gaurs and more across Noida and Greater Noida.",
  alternates: { canonical: "/builders" },
  openGraph: {
    title: "NCR builders · Creators Arena",
    description: "Browse live residential projects grouped by developer.",
    url: "/builders",
  },
};

export const dynamic = "force-dynamic";

export default async function BuildersIndexPage() {
  const properties = await getDataSource().list();
  const counts = new Map<string, number>();
  for (const p of properties) {
    counts.set(p.builder.name, (counts.get(p.builder.name) ?? 0) + 1);
  }
  const builders = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <DirectoryIndex
      eyebrow="Builders"
      title="Browse by builder"
      subtitle="Open a developer to see every live project we list, then compare against other NCR options."
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Builders", path: "/builders" },
      ]}
      items={builders.map((b) => ({
        name: b.name,
        count: b.count,
        href: builderPath(b.name),
      }))}
      icon={Building2}
    />
  );
}
