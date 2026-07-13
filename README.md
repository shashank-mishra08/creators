# Creators Home — Property Comparison Platform

A premium, venture-backed-feeling proptech experience for comparing NCR
residential properties side-by-side. Built with Next.js (App Router),
Tailwind CSS, and a robust PostgreSQL + Prisma backend.

> Comparison is the USP. Users should instantly understand **which** property is
> better, **why** it's better, and **which** suits their use case.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with a CSS-variable design system (light + dark)
- **Framer Motion** for the landing/selection motion system
- **Zustand** (persisted) for cross-page comparison selection
- **lucide-react** icons, shadcn-style UI primitives

## Pages

| Route | What it is |
| --- | --- |
| `/` | **Comparison landing** — immersive hero (glassmorphism, parallax, floating cards), Why Compare, How It Works, Featured Comparisons, CTA |
| `/properties` | **Selection** — search, filters (city / type / builder / possession / budget), property cards, sticky compare bar (pick 2–4) |
| `/compare` | **Comparison results** — overview, pricing, amenities (✓/✗), location & connectivity, floor plans, investment analysis, and a transparent recommendation score |

## Architecture — clean separation

```
UI (components)  ─►  Business logic (lib)  ─►  Data layer (Prisma/PostgreSQL)
```

- **`src/lib/types.ts`** — the domain contract: `Property`, `Builder`, `Amenity`,
  `LocationMetrics`, `InvestmentMetrics`, `ComparisonResult`, scoring types.
- **`src/lib/data-source.ts`** — the data-layer seam. UI talks to the `PropertyDataSource`
  interface, which is backed by PostgreSQL via `PrismaDataSource` and `propertyService`.
- **`src/lib/scoring.ts`** — the rule-based recommendation engine (no AI).
- **`src/store/comparison.ts`** — selection state (min 2, max 4), persisted.
- **`prisma/schema.prisma`** — detailed relational database schema for Builders, Properties, Pricing, Towers, Amenities, etc.
- **`src/app/api/` & `src/lib/services/`** — backend logic handling data fetching, user authentication, and data importing.

### Recommendation engine (rule-based, deterministic, explainable)

Weighted score, normalised **relative to the compared set** with a floor so the
weakest option stays credible rather than cratering to zero:

| Factor | Weight |
| --- | --- |
| Price | 30% |
| Amenities | 25% |
| Location | 25% |
| Builder reputation | 10% |
| Investment potential | 10% |

Outputs: **Overall Score**, **Investment Score**, and award picks — **Best
Value**, **Best Luxury**, **Best for Families**, **Best Investment** — plus
per-property **Best For** persona tags (Families / Investors / Luxury Buyers /
Rental Income).

### Database & Data Import

The platform uses a robust PostgreSQL backend managed by Prisma ORM. Property data can be ingested directly from real estate intake sheets (Excel) using the built-in import scripts.

To run database migrations and operations:
```bash
npm run db:migrate # run migrations
npm run db:push    # push schema state
npm run db:import  # import data via exceljs
npm run db:studio  # open Prisma Studio to view DB
```

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

> Heads up: don't run `npm run build` while `npm run dev` is live — they share
> `.next` and the dev server's chunks get corrupted. Stop dev first (or
> `rm -rf .next` and restart).

## Assets

Curated brand/illustration assets live under `public/` (`brand`, `properties`,
`floorplans`, `icons`, `art`). The dummy dataset references these; real CMS media
replaces them later via the data source.

## Notes

- **Dark + light themes** via `next-themes` and CSS variables (toggle in header).
- The comparison table renders its data **statically** (no animation-gated
  visibility) so critical content is always shown; landing/selection use motion
  as enhancement.
- `property-comparison.html` at the repo root is the original single-file
  prototype, kept for reference.
