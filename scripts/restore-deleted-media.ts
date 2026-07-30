/**
 * Restore the 22 property_media rows removed by fix-missing-media.ts --apply.
 * Re-inserts cover + layout URLs for the same propertyIds.
 */
import { config } from "dotenv";
config();

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const ROWS: Array<{
  propertyId: string;
  type: string;
  url: string;
  sortOrder: number;
}> = [
  { propertyId: "679d43e9-65ca-437c-a4e2-cbb74f86416d", type: "cover", url: "/properties/atlantis-cover.jpg", sortOrder: 0 },
  { propertyId: "679d43e9-65ca-437c-a4e2-cbb74f86416d", type: "layout", url: "/properties/atlantis-layout.jpg", sortOrder: 100 },
  { propertyId: "142b9550-672c-4639-84ed-80a5442a6c64", type: "cover", url: "/properties/cosmos-cover.jpg", sortOrder: 0 },
  { propertyId: "142b9550-672c-4639-84ed-80a5442a6c64", type: "layout", url: "/properties/cosmos-layout.jpg", sortOrder: 100 },
  { propertyId: "8985e2fd-2a1a-48f8-94d5-4663471c8103", type: "cover", url: "/properties/empire-cover.jpg", sortOrder: 0 },
  { propertyId: "8985e2fd-2a1a-48f8-94d5-4663471c8103", type: "layout", url: "/properties/empire-layout.jpg", sortOrder: 100 },
  { propertyId: "502ae6fd-dbb1-47cc-b9bb-2d9014b0a792", type: "cover", url: "/properties/skaimperia-cover.jpg", sortOrder: 0 },
  { propertyId: "502ae6fd-dbb1-47cc-b9bb-2d9014b0a792", type: "layout", url: "/properties/skaimperia-layout.jpg", sortOrder: 100 },
  { propertyId: "27eb168c-ab82-436c-8194-f8f868b39b26", type: "cover", url: "/properties/jade-cover.jpg", sortOrder: 0 },
  { propertyId: "27eb168c-ab82-436c-8194-f8f868b39b26", type: "layout", url: "/properties/jade-layout.jpg", sortOrder: 100 },
  { propertyId: "26c1c587-2408-4930-8d6a-1afd5a0c6194", type: "cover", url: "/properties/mayflower-cover.jpg", sortOrder: 0 },
  { propertyId: "26c1c587-2408-4930-8d6a-1afd5a0c6194", type: "layout", url: "/properties/mayflower-layout.jpg", sortOrder: 100 },
  { propertyId: "75810b81-0ea7-40f2-af3b-d0bd9390ccaa", type: "cover", url: "/properties/mulberry-cover.jpg", sortOrder: 0 },
  { propertyId: "75810b81-0ea7-40f2-af3b-d0bd9390ccaa", type: "layout", url: "/properties/mulberry-layout.jpg", sortOrder: 100 },
  { propertyId: "c40ca21d-9e5a-4a4f-900f-91686c679bb5", type: "cover", url: "/properties/oakwood-cover.jpg", sortOrder: 0 },
  { propertyId: "c40ca21d-9e5a-4a4f-900f-91686c679bb5", type: "layout", url: "/properties/oakwood-layout.jpg", sortOrder: 100 },
  { propertyId: "004f7bfb-017c-46e8-a8cd-c5da9aa224fb", type: "cover", url: "/properties/pleiaddes-cover.jpg", sortOrder: 0 },
  { propertyId: "004f7bfb-017c-46e8-a8cd-c5da9aa224fb", type: "layout", url: "/properties/pleiaddes-layout.jpg", sortOrder: 100 },
  { propertyId: "0faa06e5-ccd0-40bd-b94a-85f2ec805c48", type: "cover", url: "/properties/rosemont-cover.jpg", sortOrder: 0 },
  { propertyId: "0faa06e5-ccd0-40bd-b94a-85f2ec805c48", type: "layout", url: "/properties/rosemont-layout.jpg", sortOrder: 100 },
  { propertyId: "a85eecc2-3758-4ca4-812b-42f790ef390e", type: "cover", url: "/properties/trevana-cover.jpg", sortOrder: 0 },
  { propertyId: "a85eecc2-3758-4ca4-812b-42f790ef390e", type: "layout", url: "/properties/trevana-layout.jpg", sortOrder: 100 },
];

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  try {
    let created = 0;
    let skipped = 0;

    for (const row of ROWS) {
      const prop = await prisma.property.findUnique({
        where: { id: row.propertyId },
        select: { id: true, name: true },
      });
      if (!prop) {
        console.log(`SKIP property missing: ${row.propertyId} ${row.url}`);
        skipped++;
        continue;
      }

      const existing = await prisma.propertyMedia.findFirst({
        where: { propertyId: row.propertyId, type: row.type, url: row.url },
      });
      if (existing) {
        console.log(`ALREADY: ${row.type} ${row.url}`);
        skipped++;
        continue;
      }

      await prisma.propertyMedia.create({
        data: {
          propertyId: row.propertyId,
          type: row.type,
          url: row.url,
          sortOrder: row.sortOrder,
        },
      });
      console.log(`RESTORED: ${prop.name} → ${row.type} ${row.url}`);
      created++;
    }

    const total = await prisma.propertyMedia.count();
    console.log(`\nDone. created=${created} skipped=${skipped} total_media=${total}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
