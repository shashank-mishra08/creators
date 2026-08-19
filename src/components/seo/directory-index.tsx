import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export function DirectoryIndex({
  eyebrow,
  title,
  subtitle,
  crumbs,
  items,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  crumbs: { name: string; path: string }[];
  items: { name: string; count: number; href: string }[];
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [breadcrumbJsonLd(crumbs)],
        }}
      />
      <div className="container min-h-[70vh] py-10">
        <p className="text-[11px] font-bold uppercase tracking-wider text-accent">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-primary dark:text-foreground">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-5 shadow-glass transition-transform hover:-translate-y-0.5 hover:border-accent/40"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-foreground">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.count} {item.count === 1 ? "project" : "projects"}
                    </span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
