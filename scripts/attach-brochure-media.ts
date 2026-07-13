/**
 * One-off, idempotent data script: attach the brochure-sourced property images
 * (already saved under /public/properties) as PropertyMedia rows.
 *
 * This does NOT touch the importer, the Prisma schema or any models — it only
 * inserts rows into the existing PropertyMedia table the repository already
 * reads (cover -> Property.image). Re-running replaces only these media rows.
 *
 * Run: npx tsx scripts/attach-brochure-media.ts
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";

// Match by the property name substring (case-insensitive) so we don't depend on
// slug/id specifics. Images come from the official client brochures only.
const MEDIA: Record<string, { type: string; file: string; alt: string }[]> = {
  Arden: [
    { type: "cover", file: "arden-aerial.jpg", alt: "Godrej Arden aerial view" },
    { type: "gallery", file: "arden-lifestyle.jpg", alt: "Godrej Arden landscaped greens" },
  ],
  Sanctury: [
    { type: "cover", file: "sanctury-aerial.jpg", alt: "Northwind Sanctury front elevation" },
    { type: "gallery", file: "sanctury-exterior.jpg", alt: "Northwind Sanctury tower entrance" },
    { type: "gallery", file: "sanctury-amenities.jpg", alt: "Northwind Sanctury amenities" },
  ],
  "7Peaks Residences": [
    { type: "cover", file: "7peaks-cover.jpg", alt: "Eldeco 7 Peaks front elevation" },
    { type: "gallery", file: "7peaks-g1.jpg", alt: "Eldeco 7 Peaks balcony view" },
    { type: "gallery", file: "7peaks-g2.jpg", alt: "Eldeco 7 Peaks clubhouse atrium" },
  ],
  Estate: [
    { type: "cover", file: "estate-cover.jpg", alt: "SKA Estate front elevation" },
    { type: "gallery", file: "estate-g1.jpg", alt: "SKA Estate landscaped walkway" },
    { type: "gallery", file: "estate-g2.jpg", alt: "SKA Estate swimming pool" },
  ],
  Aurum: [
    { type: "cover", file: "aurum-cover.jpg", alt: "Sobha Aurum front elevation" },
    { type: "gallery", file: "aurum-g1.jpg", alt: "Sobha Aurum towers" },
    { type: "gallery", file: "aurum-g2.jpg", alt: "Sobha Aurum water feature" },
  ],
  "Green Hights": [
    { type: "cover", file: "divyansh-cover.jpg", alt: "Divyansh Green Hights aerial view" },
    { type: "gallery", file: "divyansh-g1.jpg", alt: "Divyansh Green Hights towers" },
    { type: "gallery", file: "divyansh-g2.jpg", alt: "Divyansh Green Hights lobby" },
  ],
  "Presidential Towers": [
    { type: "cover", file: "ashtech-cover.jpg", alt: "Ashtech Presidential Towers front elevation" },
    { type: "gallery", file: "ashtech-g1.jpg", alt: "Ashtech Presidential surroundings" },
  ],
  Rivana: [
    { type: "cover", file: "rivana-cover.jpg", alt: "Sobha Rivana towers at dusk" },
    { type: "gallery", file: "rivana-g1.jpg", alt: "Sobha Rivana tower" },
    { type: "gallery", file: "rivana-g2.jpg", alt: "Sobha Rivana aerial" },
  ],
  Majesty: [
    { type: "cover", file: "majesty-cover.jpg", alt: "Godrej Majesty front elevation" },
    { type: "gallery", file: "majesty-g1.jpg", alt: "Godrej Majesty masterplan" },
    { type: "gallery", file: "majesty-g2.jpg", alt: "Godrej Majesty clubhouse" },
  ],
  Yamuna: [
    { type: "cover", file: "yamuna-cover.jpg", alt: "VVIP Yamuna towers" },
    { type: "gallery", file: "yamuna-g1.jpg", alt: "VVIP Yamuna render" },
    { type: "gallery", file: "yamuna-g2.jpg", alt: "VVIP Yamuna render" },
    { type: "gallery", file: "yamuna-g3.jpg", alt: "VVIP Yamuna render" },
  ],
  Sunbliss: [
    { type: "cover", file: "sunbliss-cover.jpg", alt: "Purvanchal Sunbliss site plan" },
    { type: "gallery", file: "sunbliss-g1.jpg", alt: "Purvanchal Sunbliss highlights" },
  ],
  Ballads: [
    { type: "cover", file: "ballads-cover.jpg", alt: "Eldeco Ballads of Bliss render" },
    { type: "gallery", file: "ballads-g1.jpg", alt: "Eldeco Ballads of Bliss render" },
    { type: "gallery", file: "ballads-g2.jpg", alt: "Eldeco Ballads of Bliss render" },
  ],
  Echoes: [
    { type: "cover", file: "echoes-cover.jpg", alt: "Eldeco Echoes of Eden front elevation" },
    { type: "gallery", file: "echoes-g1.jpg", alt: "Eldeco Echoes of Eden render" },
    { type: "gallery", file: "echoes-g2.jpg", alt: "Eldeco Echoes of Eden render" },
  ],
  Wishpers: [
    { type: "cover", file: "whisper-cover.jpg", alt: "Eldeco Whisper of Wonder render" },
    { type: "gallery", file: "whisper-g1.jpg", alt: "Eldeco Whisper of Wonder render" },
    { type: "gallery", file: "whisper-g2.jpg", alt: "Eldeco Whisper of Wonder render" },
  ],
  CHRYSALIS: [
    { type: "cover", file: "chrysalis-cover.jpg", alt: "Gaur Chrysalis towers" },
    { type: "gallery", file: "chrysalis-g1.jpg", alt: "Gaur Chrysalis clubhouse" },
    { type: "gallery", file: "chrysalis-g2.jpg", alt: "Gaur Chrysalis clubhouse" },
  ],
  SEASONS: [
    { type: "cover", file: "arihant-cover.jpg", alt: "Arihant Seasons render" },
    { type: "gallery", file: "arihant-g1.jpg", alt: "Arihant Seasons balcony view" },
    { type: "gallery", file: "arihant-g2.jpg", alt: "Arihant Seasons lifestyle" },
  ],
  // Files not yet downloaded from the brochure share-folders — drop them into
  // public/properties/ with these names and re-run. Missing files are skipped.
  Peridona: [
    { type: "cover", file: "peridona-cover.jpg", alt: "CRC The Peridona, Jaypee Greens, Greater Noida" },
    { type: "gallery", file: "peridona-g1.jpg", alt: "CRC The Peridona view" },
    { type: "gallery", file: "peridona-g2.jpg", alt: "CRC The Peridona view" },
  ],
  "Crown Residency": [
    { type: "cover", file: "crown-cover.jpg", alt: "Godrej Crown Residency, Greater Noida" },
    { type: "gallery", file: "crown-g1.jpg", alt: "Godrej Crown Residency view" },
    { type: "gallery", file: "crown-g2.jpg", alt: "Godrej Crown Residency view" },
  ],
  // Cover = front elevation extracted from the project's brochure.
  Sephyra: [
    { type: "cover", file: "sephyra-cover.jpg", alt: "Imperia The Sephyra front elevation, Yamuna Expressway" },
  ],
};

async function main() {
  for (const [name, items] of Object.entries(MEDIA)) {
    const property = await prisma.property.findFirst({
      where: { name: { contains: name, mode: "insensitive" } },
      select: { id: true, name: true },
    });
    if (!property) {
      console.warn(`! no property matching "${name}" — skipped`);
      continue;
    }
    // Only attach files that actually exist on disk, so a missing image never
    // becomes a broken <img> row (the UI's gradient placeholder is preferable).
    const present = items.filter((m) => {
      const exists = fs.existsSync(path.resolve("public/properties", m.file));
      if (!exists) console.warn(`  ! missing file public/properties/${m.file} — skipped`);
      return exists;
    });
    if (present.length === 0) {
      console.warn(`! ${property.name}: no image files present yet — skipped`);
      continue;
    }
    // Replace only the cover/gallery media we manage here (idempotent).
    await prisma.propertyMedia.deleteMany({
      where: { propertyId: property.id, type: { in: ["cover", "gallery"] } },
    });
    await prisma.propertyMedia.createMany({
      data: present.map((m, i) => ({
        propertyId: property.id,
        type: m.type,
        url: `/properties/${m.file}`,
        alt: m.alt,
        sortOrder: i,
      })),
    });
    console.log(`✓ ${property.name}: attached ${present.length} media`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
