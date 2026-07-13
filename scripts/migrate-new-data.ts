import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import { importPaths, formatReport } from "@/lib/import/importer";

function collectXlsx(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...collectXlsx(p));
    else if (e.name.endsWith(".xlsx") && !e.name.startsWith("~$")) out.push(p);
  }
  return out;
}

async function main() {
  console.log("⏳ Wiping old property data (single source of truth = creators_new)…");
  await prisma.savedComparison.deleteMany({});
  await prisma.property.deleteMany({}); // cascades configs/amenities/media/reviews/towers/etc.
  await prisma.builder.deleteMany({});
  await prisma.user.updateMany({ data: { savedPropertyIds: [] } }); // ids no longer valid
  console.log("✓ wiped\n");

  const files = collectXlsx("creators_new").sort();
  console.log(`⏳ Importing ${files.length} datasheets from creators_new…`);
  const reports = await importPaths(files);
  console.log("\n" + formatReport(reports));

  const props = await prisma.property.count();
  const builders = await prisma.builder.findMany({ select: { name: true }, orderBy: { name: "asc" } });
  const cities = await prisma.property.groupBy({ by: ["city"], _count: true });
  console.log(`\nDB now: ${props} properties`);
  console.log("Builders (" + builders.length + "):", builders.map(b => b.name).join(" | "));
  console.log("Cities:", cities.map(c => `${c.city}(${c._count})`).join(" | "));
}
main().then(() => prisma.$disconnect()).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
