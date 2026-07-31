/**
 * Moves locally-stored images to Cloudinary and repoints the database at them.
 *
 * Covers every column that holds an asset path:
 *   - property_media.url
 *   - configurations.floor_plan_image
 *   - banners.image_url
 *
 * Safety properties:
 *   - DRY RUN BY DEFAULT. Pass --apply to actually upload and write.
 *   - Never deletes anything from public/. Local files stay exactly where they
 *     are, so rolling back is only a URL change.
 *   - Row-by-row: each row is updated straight after its own upload succeeds. A
 *     crash halfway leaves some rows migrated and some local — and both still
 *     render, because the local files were never removed.
 *   - Idempotent: rows already pointing at https:// are skipped, so re-running
 *     picks up only what's left.
 *   - Writes a mapping file (old path → new URL) for rollback.
 *
 *   npx tsx scripts/migrate-media-to-cloudinary.ts            # report only
 *   npx tsx scripts/migrate-media-to-cloudinary.ts --apply    # do it
 *   npx tsx scripts/migrate-media-to-cloudinary.ts --rollback <mapping.json>
 */
import { config } from "dotenv";
config();

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { isConfigured, uploadImage } from "../src/lib/storage/cloudinary";

const APPLY = process.argv.includes("--apply");
const ROLLBACK_IDX = process.argv.indexOf("--rollback");
/**
 * `--limit N` migrates only the first N rows.
 *
 * Lets a small batch prove the whole path — upload, URL written, page still
 * renders — before the rest follows. Safe to stop there: migrated and
 * un-migrated rows both render, since the local files are never removed.
 */
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX === -1 ? Infinity : Number(process.argv[LIMIT_IDX + 1]);
const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireEnv("DATABASE_URL") }),
});

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

const isLocalPath = (url: string) => Boolean(url) && url.startsWith("/");

/** Stable, collision-free Cloudinary id for a public/ path. */
function publicIdFor(url: string): string {
  return url
    .replace(/^\//, "")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();
}

type Job = {
  table: "property_media" | "configurations" | "banners";
  id: string;
  url: string;
};

type MappingEntry = Job & { newUrl: string };

async function collectJobs(): Promise<{ jobs: Job[]; skipped: Job[] }> {
  const media = await prisma.propertyMedia.findMany({
    select: { id: true, url: true },
  });
  const configs = await prisma.configuration.findMany({
    select: { id: true, floorPlanImage: true },
  });
  // Only the poster image: videoUrl points at a video, which this image-upload
  // path would reject, and it is empty on every row today.
  const banners = await prisma.banner.findMany({
    select: { id: true, imageUrl: true },
  });

  const all: Job[] = [
    ...media
      .filter((m) => isLocalPath(m.url))
      .map((m) => ({ table: "property_media" as const, id: m.id, url: m.url })),
    ...configs
      .filter((c) => isLocalPath(c.floorPlanImage))
      .map((c) => ({
        table: "configurations" as const,
        id: c.id,
        url: c.floorPlanImage,
      })),
    ...banners
      .filter((b) => isLocalPath(b.imageUrl))
      .map((b) => ({ table: "banners" as const, id: b.id, url: b.imageUrl })),
  ];

  // A row whose file is missing locally can't be uploaded from here. Report it
  // and leave the row untouched rather than blanking a URL that may still be
  // serving fine in production.
  const jobs: Job[] = [];
  const skipped: Job[] = [];
  for (const job of all) {
    if (fs.existsSync(path.join(PUBLIC_DIR, job.url))) jobs.push(job);
    else skipped.push(job);
  }
  return { jobs, skipped };
}

async function writeRow(job: Job, newUrl: string) {
  if (job.table === "property_media") {
    await prisma.propertyMedia.update({
      where: { id: job.id },
      data: { url: newUrl },
    });
  } else if (job.table === "banners") {
    await prisma.banner.update({
      where: { id: job.id },
      data: { imageUrl: newUrl },
    });
  } else {
    await prisma.configuration.update({
      where: { id: job.id },
      data: { floorPlanImage: newUrl },
    });
  }
}

async function rollback(mappingPath: string) {
  const entries: MappingEntry[] = JSON.parse(
    await fsp.readFile(mappingPath, "utf8"),
  );
  console.log(`Rolling back ${entries.length} rows from ${mappingPath}`);
  if (!APPLY) {
    console.log("DRY RUN — pass --apply to actually restore the old paths.");
    return;
  }
  let done = 0;
  for (const e of entries) {
    await writeRow(e, e.url);
    done++;
  }
  console.log(`Restored ${done} rows to their local paths.`);
}

async function main() {
  if (ROLLBACK_IDX !== -1) {
    const file = process.argv[ROLLBACK_IDX + 1];
    if (!file) throw new Error("--rollback needs a mapping file path");
    return rollback(file);
  }

  const { jobs: allJobs, skipped } = await collectJobs();
  const jobs = Number.isFinite(LIMIT) ? allJobs.slice(0, LIMIT) : allJobs;

  if (jobs.length !== allJobs.length) {
    console.log(`Limited to ${jobs.length} of ${allJobs.length} rows (--limit).`);
  }
  console.log(`Local-path rows to migrate : ${jobs.length}`);
  console.log(`Skipped (file not on disk) : ${skipped.length}`);
  for (const s of skipped.slice(0, 10)) {
    console.log(`   skip  [${s.table}] ${s.url}`);
  }

  if (!APPLY) {
    console.log("\nDRY RUN — nothing uploaded, nothing written.");
    console.log("Re-run with --apply to migrate.");
    for (const j of jobs.slice(0, 10)) {
      console.log(`   would upload  [${j.table}] ${j.url}  →  ${publicIdFor(j.url)}`);
    }
    if (jobs.length > 10) console.log(`   … and ${jobs.length - 10} more`);
    return;
  }

  if (!isConfigured()) {
    throw new Error(
      "Cloudinary credentials are not set. Add CLOUDINARY_CLOUD_NAME / " +
        "CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET to .env (see .env.example).",
    );
  }

  const mappingPath = path.join(
    ROOT,
    `media-migration-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  const mapping: MappingEntry[] = [];
  let ok = 0;
  let failed = 0;

  for (const [i, job] of jobs.entries()) {
    const abs = path.join(PUBLIC_DIR, job.url);
    const ext = path.extname(abs).toLowerCase();
    const type = MIME[ext];
    if (!type) {
      console.warn(`  ! unsupported type, skipping: ${job.url}`);
      failed++;
      continue;
    }

    try {
      const buf = await fsp.readFile(abs);
      const file = new File([buf], path.basename(abs), { type });
      const newUrl = await uploadImage(file, publicIdFor(job.url));

      // Write immediately: a crash after this point leaves this row consistent.
      await writeRow(job, newUrl);

      mapping.push({ ...job, newUrl });
      await fsp.writeFile(mappingPath, JSON.stringify(mapping, null, 2));
      ok++;
      console.log(`  [${i + 1}/${jobs.length}] ${job.url} → ${newUrl}`);
    } catch (err) {
      failed++;
      console.error(`  ! FAILED ${job.url}:`, (err as Error).message);
    }
  }

  console.log(`\nMigrated ${ok}, failed ${failed}, skipped ${skipped.length}.`);
  if (ok > 0) {
    console.log(`Mapping written to ${mappingPath}`);
    console.log(
      `Rollback: npx tsx scripts/migrate-media-to-cloudinary.ts --rollback "${mappingPath}" --apply`,
    );
    console.log("Local files under public/ were NOT deleted.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
