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
import { validateAndClean } from "@/lib/import/validator";
import { importFile } from "@/lib/import/importer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE_MB = 10;

/**
 * POST /api/admin/import
 * Accepts one .xlsx via multipart/form-data.
 *  - mode "preview" (default): parse + validate only, no DB write.
 *  - mode "commit": run the full importer (writes to DB + audit log).
 * Reuses the existing import engine unchanged.
 */
export async function POST(req: NextRequest) {
  let tmpPath: string | null = null;
  try {
    await requireAdminSession();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const commit = formData.get("mode") === "commit";

    if (!file) throw new AppError("No file provided", 400);
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      throw new AppError("Only .xlsx Excel files are allowed", 400);
    }
    if (file.size / (1024 * 1024) > MAX_SIZE_MB) {
      throw new AppError(`File too large. Maximum size is ${MAX_SIZE_MB}MB`, 400);
    }

    // The engine reads from a path, so stage the upload in the OS temp dir.
    tmpPath = path.join(os.tmpdir(), `${randomUUID()}.xlsx`);
    await writeFile(tmpPath, Buffer.from(await file.arrayBuffer()));

    if (commit) {
      return json({ mode: "commit", report: await importFile(tmpPath) });
    }

    // Preview: parse + validate only — nothing is written.
    const { ok, issues, project } = validateAndClean(await parseWorkbook(tmpPath));
    const summary = project && {
      name: project.property.name,
      builder: project.builder.name,
      city: project.property.city,
      locality: project.property.locality,
      possession: project.property.possession,
      priceRange: project.pricing.priceRangeLabel,
      configs: project.configurations.map((c) => `${c.label} · ${c.areaSqFt} sqft`),
      towers: project.towers.length,
      amenities: project.amenities.filter((a) => a.available).length,
      attributes: project.attributes.length,
      // Tell the admin whether publishing will update an existing project or add a new one.
      isUpdate: Boolean(
        await prisma.property.findUnique({ where: { slug: project.slug }, select: { id: true } }),
      ),
    };
    return json({ mode: "preview", ok, issues, summary });
  } catch (err) {
    return handleError(err);
  } finally {
    if (tmpPath) await unlink(tmpPath).catch(() => {});
  }
}
