import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import { parseWorkbook } from "@/lib/import/parser";
import { validateAndClean, type Issue } from "@/lib/import/validator";
import { upsertProject } from "@/lib/import/normalizer";

export interface FileReport {
  sourceFile: string;
  status: "success" | "partial" | "failed";
  created: number;
  updated: number;
  skipped: number;
  warnings: number;
  issues: Issue[];
}

/** Import a single Excel file: parse → validate/clean → upsert → audit. */
export async function importFile(
  filePath: string,
  opts: { persistAudit?: boolean } = {},
): Promise<FileReport> {
  const report: FileReport = {
    sourceFile: path.basename(filePath),
    status: "success",
    created: 0,
    updated: 0,
    skipped: 0,
    warnings: 0,
    issues: [],
  };

  try {
    const parsed = await parseWorkbook(filePath);
    const { ok, issues, project } = validateAndClean(parsed);
    report.issues = issues;
    report.warnings = issues.filter((i) => i.level === "warning").length;

    if (!ok || !project) {
      report.skipped = 1;
      report.status = "failed";
    } else {
      const action = await upsertProject(project);
      if (action === "created") report.created = 1;
      else report.updated = 1;
      report.status = report.warnings > 0 ? "partial" : "success";
    }
  } catch (e) {
    report.skipped = 1;
    report.status = "failed";
    report.issues.push({
      level: "error",
      field: "file",
      message: e instanceof Error ? e.message : String(e),
    });
  }

  if (opts.persistAudit !== false) {
    await prisma.importRun.create({
      data: {
        sourceFile: report.sourceFile,
        status: report.status,
        createdCount: report.created,
        updatedCount: report.updated,
        skippedCount: report.skipped,
        warningCount: report.warnings,
        report: report as unknown as object,
      },
    });
  }
  return report;
}

export async function importPaths(paths: string[]): Promise<FileReport[]> {
  const reports: FileReport[] = [];
  for (const p of paths) reports.push(await importFile(p));
  return reports;
}

/** Phase 8: drop any builder's sheet into this folder and re-run the importer. */
export function listIncoming(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.xlsx$/i.test(f) && !f.startsWith("~$"))
    .map((f) => path.join(dir, f));
}

export async function importDirectory(dir: string): Promise<FileReport[]> {
  return importPaths(listIncoming(dir));
}

/** Human-readable report for the CLI / logs. */
export function formatReport(reports: FileReport[]): string {
  const lines: string[] = [];
  let c = 0,
    u = 0,
    s = 0,
    w = 0;
  for (const r of reports) {
    c += r.created;
    u += r.updated;
    s += r.skipped;
    w += r.warnings;
    const icon = r.status === "failed" ? "✗" : r.status === "partial" ? "▲" : "✓";
    lines.push(
      `${icon} ${r.sourceFile} — ${r.status} (created ${r.created}, updated ${r.updated}, skipped ${r.skipped}, warnings ${r.warnings})`,
    );
    for (const i of r.issues) {
      lines.push(`    ${i.level === "error" ? "ERROR" : "warn "} [${i.field}] ${i.message}`);
    }
  }
  lines.push("");
  lines.push(
    `Total: ${reports.length} file(s) · created ${c} · updated ${u} · skipped ${s} · warnings ${w}`,
  );
  return lines.join("\n");
}
