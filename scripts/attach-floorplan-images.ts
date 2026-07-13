/**
 * Data script: copy floor-plan images from the source dataset (`creators_new`)
 * into `public/properties/` and link them to `Configuration.floorPlanImage`.
 *
 * SOURCE CONVENTION (deterministic): each project folder holds floor-plan images
 * named `<config>_<superArea>.<ext>` (e.g. `3BHK+3T_1983.png`) or, for a few
 * projects, area-only (`725.webp`) or config-only (`4BHK+U+S.png`). We link an
 * image to a config by:
 *   1. AREA match — the number in the filename equals the config's saleable area
 *      (unique per project, so the right plan always lands on the right config), or
 *   2. LABEL match — normalised config label equals the filename's config token
 *      (used only when the filename has no area or the area doesn't match, and only
 *      when that label is unique in the project).
 * Anything that matches neither is ignored (covers, galleries, site plans).
 *
 * Images are copied to `public/properties/<prefix>-fp-<configArea>.<ext>`. For a
 * project that gets at least one new link, stale `<prefix>-fp-*` files no longer
 * referenced are removed (no duplicate images). Projects with no area/label match
 * in the source are left untouched (existing links preserved).
 *
 * Idempotent. Re-run after any `db:import` (the importer recreates configs).
 * Run: npx tsx scripts/attach-floorplan-images.ts
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";

const SRC_ROOT = path.resolve("creators_new");
const PUB = path.resolve("public/properties");

// DB property name → source folder (relative to creators_new) + public prefix.
const PROJECTS: Record<string, { dir: string; prefix: string }> = {
  "The Peridona": { dir: "Greater Noida East/CRC Peridona", prefix: "peridona" },
  "Crown Residency": { dir: "Greater Noida East/Creators Godrej Crown Residency", prefix: "crown" },
  "Green Hights": { dir: "Greater Noida East/Divyansh Green Hights", prefix: "greenhights" },
  "7Peaks Residences": { dir: "Greater Noida East/Eldeco 7Peaks", prefix: "7peaks" },
  Arden: { dir: "Greater Noida East/Godrej Arden", prefix: "arden" },
  Sanctury: { dir: "Greater Noida East/Northwind Estate", prefix: "sanctury" },
  Estate: { dir: "Greater Noida East/SKA Estate", prefix: "estate" },
  Aurum: { dir: "Greater Noida East/Sobha Aurum", prefix: "aurum" },
  "Presidential Towers": { dir: "Greater Noida West/Ashtech Presidential", prefix: "presidential" },
  Majesty: { dir: "Greater Noida West/Godrej Majesty", prefix: "majesty" },
  Rivana: { dir: "Greater Noida West/Sobha Rivana", prefix: "rivana" },
  SEASONS: { dir: "Yamuna Expressway/Arihant Seasone", prefix: "seasons" },
  "Ballads of Bliss": { dir: "Yamuna Expressway/Eldeco Ballads of Bliss", prefix: "ballads" },
  "Echoes of Eden": { dir: "Yamuna Expressway/Eldeco Echoes of Eden", prefix: "echoes" },
  "Wishpers of Wonder": { dir: "Yamuna Expressway/Eldeco Whisper of Wonder", prefix: "wishpers" },
  "CHRYSALIS (Phase 1)": { dir: "Yamuna Expressway/Gaur Chrysalis", prefix: "chrysalis" },
  "THE SEPHYRA": { dir: "Yamuna Expressway/Imperia Sephyra", prefix: "sephyra" },
  Sunbliss: { dir: "Yamuna Expressway/Purvanchal Sunbliss", prefix: "sunbliss" },
  Yamuna: { dir: "Yamuna Expressway/VVIP Yamuna", prefix: "yamuna" },
};

const PLAN_EXTS = new Set([".png", ".webp", ".jpg", ".jpeg"]);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

type Parsed = { file: string; ext: string; area: number | null; normLabel: string; used: boolean };

/** Parse a source filename into { area, normLabel }. Area = last number in the
 *  name (commas stripped); label = the text before it (or whole name if no number). */
function parseFile(file: string): Parsed | null {
  const ext = path.extname(file).toLowerCase();
  if (!PLAN_EXTS.has(ext)) return null;
  const base = file.slice(0, -ext.length);
  const m = base.match(/^(.*?)[_\s-]*([\d,]{3,})\s*$/); // trailing 3+ digit number
  if (m) {
    const area = Number(m[2].replace(/,/g, ""));
    return { file, ext, area: Number.isFinite(area) ? area : null, normLabel: norm(m[1]), used: false };
  }
  return { file, ext, area: null, normLabel: norm(base), used: false };
}

async function main() {
  const props = await prisma.property.findMany({
    select: { name: true, configurations: { select: { id: true, label: true, areaSqFt: true }, orderBy: { sortOrder: "asc" } } },
  });

  const linked: string[] = [];
  const missing: string[] = [];
  const reviews: string[] = [];
  const perPrefixLinked = new Map<string, Set<string>>();

  for (const p of props) {
    const cfg = PROJECTS[p.name];
    if (!cfg) continue;
    const srcDir = path.join(SRC_ROOT, cfg.dir);
    if (!fs.existsSync(srcDir)) continue;

    const parsed = fs
      .readdirSync(srcDir)
      .map(parseFile)
      .filter((x): x is Parsed => x !== null);

    const normLabelCounts = new Map<string, number>();
    for (const c of p.configurations)
      normLabelCounts.set(norm(c.label), (normLabelCounts.get(norm(c.label)) ?? 0) + 1);

    const linkedThisPrefix = new Set<string>();

    for (const c of p.configurations) {
      // 1) area match
      let hit = c.areaSqFt > 0 ? parsed.find((f) => !f.used && f.area === c.areaSqFt) : undefined;
      // 2) label match (only if label is unique in this project)
      if (!hit && normLabelCounts.get(norm(c.label)) === 1) {
        hit = parsed.find((f) => !f.used && f.normLabel === norm(c.label));
        if (hit && hit.area != null && hit.area !== c.areaSqFt)
          reviews.push(`${p.name} · "${c.label}" (db area ${c.areaSqFt}) matched by label to "${hit.file}" (filename area ${hit.area}) — verify area`);
      }
      if (!hit) {
        if (c.areaSqFt > 0) missing.push(`${p.name} · "${c.label}" (${c.areaSqFt})`);
        continue;
      }
      hit.used = true;
      const dest = `${cfg.prefix}-fp-${c.areaSqFt}${hit.ext}`;
      fs.copyFileSync(path.join(srcDir, hit.file), path.join(PUB, dest));
      await prisma.configuration.update({ where: { id: c.id }, data: { floorPlanImage: `/properties/${dest}` } });
      linked.push(`${p.name} · "${c.label}" (${c.areaSqFt}) → ${dest}`);
      linkedThisPrefix.add(dest);
    }

    if (linkedThisPrefix.size) perPrefixLinked.set(cfg.prefix, linkedThisPrefix);
  }

  // Remove stale <prefix>-fp-* files for prefixes we (re)linked this run.
  let removed = 0;
  for (const [prefix, keep] of perPrefixLinked) {
    for (const f of fs.readdirSync(PUB)) {
      if (f.startsWith(`${prefix}-fp-`) && !keep.has(f)) {
        fs.unlinkSync(path.join(PUB, f));
        removed++;
      }
    }
  }

  console.log(`\n✓ linked ${linked.length} floor-plan images:`);
  linked.forEach((l) => console.log(`  ${l}`));
  console.log(`\nremoved ${removed} stale/duplicate image file(s).`);
  if (missing.length) {
    console.log(`\n${missing.length} config(s) still without a floor-plan image:`);
    missing.forEach((m) => console.log(`  · ${m}`));
  }
  if (reviews.length) {
    console.log(`\n⚠ ${reviews.length} item(s) need manual review:`);
    reviews.forEach((r) => console.log(`  · ${r}`));
  }
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
