/**
 * Download property media files that exist in the DB but are missing under
 * public/, by fetching them from a running deployed Next.js origin.
 *
 * Does NOT change the database — only fills local public/ files.
 *
 *   MEDIA_ORIGIN=https://your-next-app.vercel.app npx tsx scripts/pull-remote-media.ts
 *
 * Or:
 *   npx tsx scripts/pull-remote-media.ts https://your-next-app.vercel.app
 */
import { config } from "dotenv";
config();

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const origin = (
  process.argv[2] ||
  process.env.MEDIA_ORIGIN ||
  process.env.MEDIA_ASSET_ORIGIN ||
  ""
).replace(/\/$/, "");

async function main() {
  if (!origin || !/^https?:\/\//i.test(origin)) {
    console.error(
      "Usage:\n" +
        "  MEDIA_ORIGIN=https://your-deployed-next-app.example npx tsx scripts/pull-remote-media.ts\n" +
        "  npx tsx scripts/pull-remote-media.ts https://your-deployed-next-app.example\n\n" +
        "Use the Next.js app URL where property covers already load (not the WordPress site).",
    );
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  try {
    const media = await prisma.propertyMedia.findMany({
      select: { url: true, type: true },
    });

    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const m of media) {
      if (!m.url.startsWith("/")) {
        skipped++;
        continue;
      }
      const local = path.join(process.cwd(), "public", m.url);
      if (fs.existsSync(local)) {
        skipped++;
        continue;
      }

      const remote = origin + m.url;
      process.stdout.write(`GET ${remote} … `);
      try {
        const res = await fetch(remote, {
          headers: { "User-Agent": "creators-local-media-pull/1.0" },
        });
        if (!res.ok) {
          console.log(`FAIL ${res.status}`);
          failed++;
          continue;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 100) {
          console.log(`FAIL too small (${buf.length}b)`);
          failed++;
          continue;
        }
        await fs.promises.mkdir(path.dirname(local), { recursive: true });
        await fs.promises.writeFile(local, buf);
        console.log(`OK ${buf.length} bytes → ${m.url}`);
        downloaded++;
      } catch (e) {
        console.log(`FAIL ${(e as Error).message}`);
        failed++;
      }
    }

    console.log(
      `\nDone. downloaded=${downloaded} already_local=${skipped} failed=${failed}`,
    );
    if (failed > 0) {
      console.log(
        "If failures are 404, this origin is not the Next app that hosts /properties/* images.",
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
