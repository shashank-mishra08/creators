import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import { AppError, BadRequestError } from "@/lib/errors";

/** Uniform success envelope. */
export function json<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

/** Parse a JSON request body, surfacing a 400 (not a 500) on malformed input. */
export async function parseJsonBody(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON");
  }
}

/** Translate thrown errors into safe JSON responses with the right status. */
export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: err.flatten() },
      { status: 422 },
    );
  }
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[api] unexpected error:", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

/** Collect repeated and comma-separated query values into a flat list. */
export function collectParams(
  params: URLSearchParams,
  ...keys: string[]
): string[] {
  const out: string[] = [];
  for (const key of keys) {
    for (const v of params.getAll(key)) {
      out.push(...v.split(",").map((s) => s.trim()).filter(Boolean));
    }
  }
  return out;
}
