import path from "node:path";
import ExcelJS from "exceljs";
import {
  FIELD_TARGET,
  SECTIONS,
  amenitySlug,
  norm,
  resolveKey,
} from "@/lib/import/field-map";

/** Raw, pre-validation structure extracted from one sheet. */
export interface ParsedProject {
  sourceFile: string;
  scalars: Record<string, string>;
  configMatrix: Record<string, string[]>;
  parking: Record<string, string>;
  amenities: { slug: string; label: string; raw: string }[];
  highlights: { key: string; value: string }[];
  /** Anything we couldn't map — preserved, never dropped (→ PropertyAttribute). */
  unmapped: { section: string; label: string; value: string }[];
}

function cellText(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    // hyperlinks / rich text
    const anyV = v as { text?: string; result?: unknown; hyperlink?: string };
    if (anyV.hyperlink) return String(anyV.hyperlink);
    if (anyV.text) return String(anyV.text);
    if (anyV.result !== undefined) return String(anyV.result);
    return "";
  }
  return String(v).trim();
}

export async function parseWorkbook(filePath: string): Promise<ParsedProject> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const ws = wb.worksheets[0];

  const out: ParsedProject = {
    sourceFile: path.basename(filePath),
    scalars: {},
    configMatrix: {},
    parking: {},
    amenities: [],
    highlights: [],
    unmapped: [],
  };

  let section = "basic";
  const maxCol = ws.columnCount;

  ws.eachRow((row) => {
    const label = cellText(row.getCell(1));
    if (!label) return;

    const nlabel = norm(label);
    if (nlabel === "field") return; // "Field | Value" header rows

    // section header? (only col A populated, matches a known section)
    const second = cellText(row.getCell(2));
    if (SECTIONS[nlabel] && !second) {
      section = SECTIONS[nlabel];
      return;
    }

    // collect value columns B..N, trim trailing blanks
    const vals: string[] = [];
    for (let c = 2; c <= maxCol; c++) vals.push(cellText(row.getCell(c)));
    while (vals.length && vals[vals.length - 1] === "") vals.pop();

    const key = resolveKey(label);
    const target = key ? FIELD_TARGET[key] : undefined;

    if (key && target === "matrix") {
      out.configMatrix[key] = vals;
      return;
    }
    if (key && target === "parking") {
      out.parking[key] = vals[0] ?? "";
      return;
    }
    if (key && target === "scalar") {
      out.scalars[key] = vals[0] ?? "";
      return;
    }
    if (section === "amenities") {
      out.amenities.push({ slug: amenitySlug(label), label, raw: vals[0] ?? "" });
      return;
    }
    if (section === "highlight") {
      out.highlights.push({ key: label, value: vals.join(" ").trim() });
      return;
    }
    out.unmapped.push({ section, label, value: vals.join(" ").trim() });
  });

  return out;
}
