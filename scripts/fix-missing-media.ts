/**
 * DRY-RUN ONLY — lists property_media rows whose files are missing under public/.
 *
 * Does NOT delete or modify the database. Media URLs may still be valid on
 * production even when files are absent from this machine's public/ folder.
 *
 *   npx tsx scripts/fix-missing-media.ts
 */
import { config } from "dotenv";
config();

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  if (process.argv.includes("--apply") || process.argv.includes("--delete")) {
    console.error(
      "Refusing to delete media from the database.\n" +
        "Missing local files ≠ bad DB rows (prod may still have those assets).\n" +
        "Fix: copy images into public/properties/ or re-upload via admin.",
    );
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });

  try {
    const media = await prisma.propertyMedia.findMany({
      select: { id: true, url: true, type: true, propertyId: true },
    });

    const missing: typeof media = [];
    for (const m of media) {
      if (!m.url.startsWith("/")) continue;
      const file = path.join(process.cwd(), "public", m.url);
      if (!fs.existsSync(file)) missing.push(m);
    }

    console.log(
      `Media rows: ${media.length}. Missing on THIS machine's public/: ${missing.length}.`,
    );
    for (const m of missing) {
      console.log(`  [${m.type}] ${m.url}  (property ${m.propertyId})`);
    }
    if (missing.length) {
      console.log(
        "\nReport only — DB was not changed. Copy the files into public/ or upload via admin.",
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
