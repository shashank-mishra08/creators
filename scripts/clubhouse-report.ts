/**
 * Read-only snapshot of the Clubhouse amenity across live properties.
 *
 * Used to capture the state either side of `set-clubhouse.ts`, and to prove
 * afterwards that nothing else moved. Writes nothing, ever.
 *
 *   npx tsx scripts/clubhouse-report.ts
 */
import "dotenv/config";
import { prisma } from "@/lib/db/prisma";

const KEY = "clubhouse";

async function main() {
  const properties = await prisma.property.findMany({
    where: { deletedAt: null },
    select: {
      slug: true,
      name: true,
      amenities: { where: { key: KEY }, select: { id: true, available: true } },
      _count: { select: { amenities: true } },
    },
    orderBy: { name: "asc" },
  });

  const yes = properties.filter((p) => p.amenities.some((a) => a.available));
  const no = properties.filter(
    (p) => p.amenities.length > 0 && !p.amenities.some((a) => a.available),
  );
  const missing = properties.filter((p) => p.amenities.length === 0);
  const dupes = properties.filter((p) => p.amenities.length > 1);

  console.log(`live properties      : ${properties.length}`);
  console.log(`  Clubhouse = Yes    : ${yes.length}`);
  console.log(`  Clubhouse = No     : ${no.length}`);
  console.log(`  no Clubhouse row   : ${missing.length}`);
  console.log(`  DUPLICATE rows     : ${dupes.length}`);
  if (dupes.length) dupes.forEach((p) => console.log(`      ${p.slug} (${p.amenities.length})`));

  // Total amenity rows, so a later run can show only Clubhouse moved.
  const total = await prisma.amenity.count({ where: { property: { deletedAt: null } } });
  const clubRows = await prisma.amenity.count({
    where: { key: KEY, property: { deletedAt: null } },
  });
  console.log(`  amenity rows total : ${total}  (of which Clubhouse: ${clubRows})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
