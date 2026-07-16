import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { requireAdminSession } from "@/lib/auth/admin-session";
import { handleError, json } from "@/lib/api/http";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/db/prisma";
import { parseWorkbook } from "@/lib/import/parser";
import { validateAndClean, type Issue } from "@/lib/import/validator";
import { normalizedToFormData } from "@/lib/import/to-form-data";
import type { PropertyFormData } from "@/components/admin/property-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE_MB = 10;
const MAX_FILES = 20;

interface PreviewResult {
  fileName: string;
  ok: boolean; // false → has errors → cannot be published
  issues: Issue[];
  formData: PropertyFormData | null;
  existingId: string | null; // set → publishing will UPDATE this property
}

/**
 * POST /api/admin/import
 * Accepts one or more .xlsx via multipart/form-data ("file", repeatable).
 * Parses + validates each and returns prefilled form data for review.
 * NOTHING is written to the DB here — publishing happens through the existing
 * property create/update APIs once the admin saves the form.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdminSession();

    const form = await req.formData();
    const files = form.getAll("file").filter((f): f is File => f instanceof File);

    if (files.length === 0) throw new AppError("No file provided", 400);
    if (files.length > MAX_FILES) throw new AppError(`Too many files. Max ${MAX_FILES} at once.`, 400);

    const results: PreviewResult[] = [];
    for (const file of files) results.push(await previewOne(file));
    return json({ results });
  } catch (err) {
    return handleError(err);
  }
}

/** Parse + validate a single file. Never throws — file-level errors are reported inline. */
async function previewOne(file: File): Promise<PreviewResult> {
  const fail = (message: string): PreviewResult => ({
    fileName: file.name,
    ok: false,
    issues: [{ level: "error", field: "file", message }],
    formData: null,
    existingId: null,
  });

  if (!file.name.toLowerCase().endsWith(".xlsx")) return fail("Only .xlsx Excel files are allowed");
  if (file.size / (1024 * 1024) > MAX_SIZE_MB) return fail(`File too large (max ${MAX_SIZE_MB}MB)`);

  const tmpPath = path.join(os.tmpdir(), `${randomUUID()}.xlsx`);
  try {
    await writeFile(tmpPath, Buffer.from(await file.arrayBuffer()));
    const { ok, issues, project } = validateAndClean(await parseWorkbook(tmpPath));
    if (!project) return { fileName: file.name, ok, issues, formData: null, existingId: null };

    const existing = await prisma.property.findUnique({
      where: { slug: project.slug },
      select: { id: true },
    });
    return {
      fileName: file.name,
      ok,
      issues,
      formData: normalizedToFormData(project),
      existingId: existing?.id ?? null,
    };
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}
