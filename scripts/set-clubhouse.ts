/**
 * Gives every property a Clubhouse amenity row, set to available.
 *
 * 43 of the 45 projects carry no clubhouse row at all, so `mapProperty` fell
 * back to `false` and the detail page's stat block read "Clubhouse — No". The
 * admin could not correct it either: the edit form only rendered amenities the
 * property already had, so there was no checkbox to tick. That half is fixed in
 * `property-form.tsx`; this backfills the records that are already live.
 *
 * The slug has to be exactly `clubhouse` — `AMENITY_SLUG_TO_KEY` in the
 * repository looks it up verbatim, with no normalising at read time.
 *
 * Idempotent: an existing row is updated rather than duplicated, and running it
 * twice changes nothing the second time.
 *
 *   npx tsx scripts/set-clubhouse.ts            # dry run, prints the plan
 *   npx tsx scripts/set-clubhouse.ts --apply    # writes
 */
import "dotenv/config";
import { prisma } from "@/lib/db/prisma";

const KEY = "clubhouse";
const LABEL = "Clubhouse";

async function main() {
  const apply = process.argv.includes("--apply");

  const properties = await prisma.property.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      amenities: { where: { key: KEY }, select: { id: true, available: true } },
    },
    orderBy: { name: "asc" },
  });

  const toCreate = properties.filter((p) => p.amenities.length === 0);
  const toEnable = properties.filter(
    (p) => p.amenities.length > 0 && !p.amenities[0].available,
  );
  const alreadyOk = properties.length - toCreate.length - toEnable.length;

  console.log(`${properties.length} live properties`);
  console.log(`  already Clubhouse = Yes : ${alreadyOk}`);
  console.log(`  row missing, will create: ${toCreate.length}`);
  console.log(`  row present but No      : ${toEnable.length}`);

  if (!apply) {
    console.log("\nDry run — nothing written. Re-run with --apply to make the change.");
    return;
  }

  for (const p of toCreate) {
    await prisma.amenity.create({
      data: { propertyId: p.id, key: KEY, label: LABEL, available: true },
    });
  }
  for (const p of toEnable) {
    await prisma.amenity.update({
      where: { id: p.amenities[0].id },
      data: { available: true },
    });
  }

  const still = await prisma.amenity.count({
    where: { key: KEY, available: true, property: { deletedAt: null } },
  });
  console.log(`\nWrote ${toCreate.length} new rows, updated ${toEnable.length}.`);
  console.log(`Clubhouse = Yes on ${still} of ${properties.length} properties.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
