import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";

const PUB = path.resolve("public/properties");

const PROJECTS: Record<string, { prefix: string }> = {
  "The Peridona": { prefix: "peridona" },
  "Crown Residency": { prefix: "crown" },
  "Green Hights": { prefix: "greenhights" },
  "7Peaks Residences": { prefix: "7peaks" },
  Arden: { prefix: "arden" },
  Sanctury: { prefix: "sanctury" },
  Estate: { prefix: "estate" },
  Aurum: { prefix: "aurum" },
  "Presidential Towers": { prefix: "presidential" },
  Majesty: { prefix: "majesty" },
  Rivana: { prefix: "rivana" },
  SEASONS: { prefix: "seasons" },
  "Ballads of Bliss": { prefix: "ballads" },
  "Echoes of Eden": { prefix: "echoes" },
  "Wishpers of Wonder": { prefix: "wishpers" },
  "CHRYSALIS (Phase 1)": { prefix: "chrysalis" },
  "THE SEPHYRA": { prefix: "sephyra" },
  Sunbliss: { prefix: "sunbliss" },
  Yamuna: { prefix: "yamuna" },
};

async function main() {
  const props = await prisma.property.findMany({
    select: { id: true, name: true, configurations: { select: { id: true, label: true, areaSqFt: true }, orderBy: { sortOrder: "asc" } } },
  });

  const files = fs.existsSync(PUB) ? fs.readdirSync(PUB).filter(f => !f.startsWith('.')) : [];
  
  let linkedPlans = 0;
  let linkedLayouts = 0;

  for (const p of props) {
    const cfg = PROJECTS[p.name];
    if (!cfg) continue;

    // 1. Link Layout (Master Plan)
    const layoutFiles = files.filter(f => f.startsWith(`${cfg.prefix}-layout.`));
    if (layoutFiles.length > 0) {
      const existingMedia = await prisma.propertyMedia.findFirst({
        where: { propertyId: p.id, type: 'layout' }
      });
      if (!existingMedia) {
        await prisma.propertyMedia.create({
          data: {
            propertyId: p.id,
            type: 'layout',
            url: `/properties/${layoutFiles[0]}`,
            sortOrder: 0,
          }
        });
        linkedLayouts++;
      }
    }

    // 2. Link Floor Plans
    for (const c of p.configurations) {
      if (c.areaSqFt > 0) {
        const fpFiles = files.filter(f => f.startsWith(`${cfg.prefix}-fp-${c.areaSqFt}.`));
        if (fpFiles.length > 0) {
          await prisma.configuration.update({
            where: { id: c.id },
            data: { floorPlanImage: `/properties/${fpFiles[0]}` }
          });
          linkedPlans++;
        }
      }
    }
  }

  console.log(`Successfully linked ${linkedPlans} floor plans and ${linkedLayouts} master plans.`);
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
