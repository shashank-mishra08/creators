/**
 * One-off professionalisation pass: full project names, complete locations,
 * fixed city/builder typos. Safe to re-run (idempotent).
 *   npx tsx scripts/normalize-data.ts
 */
import "dotenv/config";
import { prisma } from "@/lib/db/prisma";

// current DB name -> full professional name
const NAME: Record<string, string> = {
  Arden: "Godrej Arden",
  Sanctury: "Northwind Sanctuary",
  "7Peaks Residences": "Eldeco 7 Peaks Residences",
  "Crown Residency": "Godrej Crown Residency",
  Estate: "SKA Estate",
  Aurum: "Sobha Aurum",
  Sunbliss: "Purvanchal Sunbliss",
  Yamuna: "VVIP Yamuna",
  "Ballads of Bliss": "Eldeco Ballads of Bliss",
  "Echoes of Eden": "Eldeco Echoes of Eden",
  "Wishpers of Wonder": "Eldeco Whisper of Wonder",
  "CHRYSALIS (Phase 1)": "Gaur Chrysalis (Phase 1)",
  "The Peridona": "CRC The Peridona",
  "Green Hights": "Divyansh Green Heights",
  Rivana: "Sobha Rivana",
  "Presidential Towers": "Ashtech Presidential Towers",
  Majesty: "Godrej Majesty",
  SEASONS: "Arihant Seasons",
};

const BUILDER: Record<string, string> = {
  "Purvanchal ProjProjectcts": "Purvanchal Projects",
  ELDECO: "Eldeco",
  GAURS: "Gaurs",
  ARIHANT: "Arihant",
};

const LOCALITY: Record<string, string> = {
  "Jaypee greens": "Jaypee Greens",
};

function fixLocality(loc: string): string {
  if (LOCALITY[loc]) return LOCALITY[loc];
  // pure sector codes like "22D", "27", "12" -> "Sector 22D"
  if (/^[0-9]{1,3}[A-Za-z]?$/.test(loc.trim())) return `Sector ${loc.trim()}`;
  return loc;
}

async function main() {
  const props = await prisma.property.findMany({
    select: { id: true, name: true, city: true, locality: true },
  });
  for (const p of props) {
    const data: Record<string, string> = {};
    if (NAME[p.name]) data.name = NAME[p.name];
    if (p.city.trim() === "Yamuna Expessway") data.city = "Yamuna Expressway";
    const loc = fixLocality(p.locality);
    if (loc !== p.locality) data.locality = loc;
    if (Object.keys(data).length) {
      await prisma.property.update({ where: { id: p.id }, data });
      console.log(`✓ ${p.name} -> ${data.name ?? p.name} | ${data.city ?? p.city} | ${data.locality ?? p.locality}`);
    }
  }
  for (const [from, to] of Object.entries(BUILDER)) {
    const r = await prisma.builder.updateMany({ where: { name: from }, data: { name: to } });
    if (r.count) console.log(`✓ builder "${from}" -> "${to}" (${r.count})`);
  }
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
