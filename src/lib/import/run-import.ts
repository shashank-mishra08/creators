import "dotenv/config";
import path from "node:path";
import { parseWorkbook } from "@/lib/import/parser";
import { validateAndClean } from "@/lib/import/validator";
import {
  formatReport,
  importPaths,
  listIncoming,
  type FileReport,
} from "@/lib/import/importer";

const INCOMING = path.resolve(process.cwd(), "data/incoming");

/** Parse + validate only — no DB writes. Verifies sheets before importing. */
async function dryRun(files: string[]): Promise<FileReport[]> {
  const reports: FileReport[] = [];
  for (const f of files) {
    const parsed = await parseWorkbook(f);
    const { ok, issues, project } = validateAndClean(parsed);
    const warnings = issues.filter((i) => i.level === "warning").length;
    reports.push({
      sourceFile: path.basename(f),
      status: ok ? (warnings ? "partial" : "success") : "failed",
      created: 0,
      updated: 0,
      skipped: ok ? 0 : 1,
      warnings,
      issues,
    });
    if (project) {
      console.log(
        `\n— preview: ${project.property.name} (${project.slug}) —\n` +
          JSON.stringify(
            {
              builder: project.builder.name,
              city: project.property.city,
              possession: project.property.possession,
              pricePerSqFt: project.pricing.pricePerSqFt,
              priceRange: project.pricing.priceRangeLabel,
              configs: project.configurations.map((c) => `${c.label}:${c.areaSqFt}`),
              towers: project.towers.length,
              amenities: project.amenities.filter((a) => a.available).length,
              attributes: project.attributes.length,
            },
            null,
            2,
          ),
      );
    }
  }
  return reports;
}

async function main() {
  const argv = process.argv.slice(2);
  const dry = argv.includes("--dry");
  const fileArgs = argv.filter((a) => !a.startsWith("--"));
  const files = fileArgs.length ? fileArgs : listIncoming(INCOMING);

  if (files.length === 0) {
    console.error(`No .xlsx files found. Put sheets in ${INCOMING} or pass paths.`);
    process.exit(1);
  }

  if (dry) {
    console.log("\n" + formatReport(await dryRun(files)));
    return;
  }

  const reports = await importPaths(files);
  console.log("\n" + formatReport(reports));
  const { prisma } = await import("@/lib/db/prisma");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
