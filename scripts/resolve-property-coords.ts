/**
 * Fills location_metrics.latitude/longitude by resolving each project's stored
 * Google Maps short link.
 *
 * Only links that expand to a real maps URL carry coordinates. In the current
 * data that is 10 of 38 projects: the rest are `share.google` links which land
 * on a Google *Search* page and contain no position at all. Those are reported
 * and left null — a guessed coordinate would point a buyer at the wrong site,
 * so the UI falls back to city-level matching instead.
 *
 * DRY RUN BY DEFAULT. Pass --apply to write.
 *
 *   npx tsx scripts/resolve-property-coords.ts
 *   npx tsx scripts/resolve-property-coords.ts --apply
 */
import { config } from "dotenv";
config();

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const APPLY = process.argv.includes("--apply");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireEnv("DATABASE_URL") }),
});

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

/**
 * Pull coordinates out of an expanded Google Maps URL.
 *
 * `!3d<lat>!4d<lng>` is the place's own position and is preferred; `@lat,lng`
 * is only the map viewport centre, which can sit some way off the pin.
 */
function parseCoords(url: string): { lat: number; lng: number } | null {
  const place = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (place) return { lat: Number(place[1]), lng: Number(place[2]) };

  const viewport = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (viewport) return { lat: Number(viewport[1]), lng: Number(viewport[2]) };

  return null;
}

/** Sanity bounds for the NCR market this site covers. */
function looksPlausible(lat: number, lng: number): boolean {
  return lat > 27 && lat < 30 && lng > 76 && lng < 79;
}

async function expand(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(25_000),
    });
    return res.url || null;
  } catch {
    return null;
  }
}

async function main() {
  const rows = await prisma.locationMetric.findMany({
    select: {
      id: true,
      mapsUrl: true,
      latitude: true,
      longitude: true,
      property: { select: { name: true, city: true } },
    },
  });

  console.log(`location rows: ${rows.length}`);
  const pending = rows.filter((r) => r.mapsUrl && r.latitude == null);
  console.log(`already have coords: ${rows.length - pending.length}`);
  console.log(`to attempt: ${pending.length}\n`);

  let resolved = 0;
  let unresolved = 0;
  const failures: string[] = [];

  for (const [i, row] of pending.entries()) {
    const name = row.property.name;
    const finalUrl = await expand(row.mapsUrl!);
    const coords = finalUrl ? parseCoords(finalUrl) : null;

    if (!coords) {
      unresolved++;
      failures.push(`${name} (${row.property.city})`);
      console.log(`  [${i + 1}/${pending.length}] — ${name}: no coordinates in link`);
      continue;
    }

    if (!looksPlausible(coords.lat, coords.lng)) {
      unresolved++;
      failures.push(`${name} — implausible ${coords.lat},${coords.lng}`);
      console.log(
        `  [${i + 1}/${pending.length}] ! ${name}: ${coords.lat},${coords.lng} outside NCR, skipped`,
      );
      continue;
    }

    resolved++;
    console.log(`  [${i + 1}/${pending.length}] ✓ ${name}: ${coords.lat}, ${coords.lng}`);

    if (APPLY) {
      await prisma.locationMetric.update({
        where: { id: row.id },
        data: { latitude: coords.lat, longitude: coords.lng },
      });
    }
  }

  console.log(`\nresolved: ${resolved}   unresolved: ${unresolved}`);
  if (failures.length) {
    console.log("\nThese need coordinates entered by hand in the admin form:");
    for (const f of failures) console.log(`  - ${f}`);
  }
  if (!APPLY) {
    console.log("\nDRY RUN — nothing written. Re-run with --apply to save.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
