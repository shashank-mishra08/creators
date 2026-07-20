"use client";

import * as React from "react";
import {
  UploadCloud, FileSpreadsheet, Loader2, CheckCircle2,
  AlertTriangle, XCircle, ChevronLeft, PencilLine,
} from "lucide-react";
import { PropertyForm, type PropertyFormData } from "@/components/admin/property-form";

type Issue = { level: "error" | "warning"; field: string; message: string };
type Result = {
  fileName: string;
  ok: boolean;
  issues: Issue[];
  formData: PropertyFormData | null;
  existingId: string | null;
  published?: boolean; // set once the admin saves this one
};

export default function AdminImportPage() {
  const [results, setResults] = React.useState<Result[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [error, setError] = React.useState("");

  const reset = () => {
    setResults([]); setSelected(null); setError("");
  };

  const onSelectFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(""); setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("file", f));
      const res = await fetch("/api/admin/import", { method: "POST", body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Upload failed");
      setResults(body.data.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Save the edited form via the existing property APIs (create or update).
  const handleSave = async (index: number, payload: unknown) => {
    const item = results[index];
    const url = item.existingId
      ? `/api/admin/properties/${item.existingId}`
      : "/api/admin/properties/create";
    const res = await fetch(url, {
      method: item.existingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save property");

    setResults((prev) => prev.map((r, i) => (i === index ? { ...r, published: true } : r)));
    setSelected(null);
  };

  // ── Editing view: the full existing form, prefilled from the sheet ──
  if (selected !== null && results[selected]?.formData) {
    const item = results[selected];
    return (
      <div>
        <div className="px-6 lg:px-8 pt-6">
          <button
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ChevronLeft className="w-4 h-4" /> Back to import list
          </button>
        </div>
        <PropertyForm
          title={item.existingId ? "Review & Update from Excel" : "Review & Publish from Excel"}
          subtitle={item.fileName}
          initialData={item.formData!}
          onSubmit={(payload) => handleSave(selected, payload)}
        />
      </div>
    );
  }

  // ── List / upload view ──
  const publishedCount = results.filter((r) => r.published).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Import from Excel</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Upload one or more property sheets (.xlsx). Review each in the full form, then publish to the live site.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-5 mb-6">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {results.length === 0 ? (
        <label className="flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center cursor-pointer hover:border-[#7166F0] hover:bg-[#7166F0]/[0.02] transition-colors">
          <div className="w-14 h-14 rounded-full bg-[#7166F0]/10 flex items-center justify-center text-[#7166F0]">
            {uploading ? <Loader2 className="w-7 h-7 animate-spin" /> : <UploadCloud className="w-7 h-7" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {uploading ? "Reading & validating…" : "Choose Excel file(s)"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Only .xlsx · up to 10MB each · up to 20 files</p>
          </div>
          <input
            type="file"
            accept=".xlsx"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => onSelectFiles(e.target.files)}
          />
        </label>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {results.length} sheet(s){publishedCount > 0 && ` · ${publishedCount} published`}
            </p>
            <button onClick={reset} className="text-sm font-medium text-[#7166F0] hover:underline">
              Upload different files
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
            {results.map((r, i) => {
              const errors = r.issues.filter((x) => x.level === "error");
              const warnings = r.issues.filter((x) => x.level === "warning");
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${r.published ? "bg-green-50 text-green-600" : "bg-emerald-50 text-emerald-600"}`}>
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {r.formData?.name || r.fileName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{r.fileName}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {r.published ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Published ✓</span>
                      ) : !r.ok ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Cannot import</span>
                      ) : r.existingId ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Will update</span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Will add new</span>
                      )}
                      {errors.length > 0 && (
                        <span className="text-xs text-red-600 inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> {errors.length} error(s)
                        </span>
                      )}
                      {warnings.length > 0 && (
                        <span className="text-xs text-amber-600 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {warnings.length} warning(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {r.published ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Live
                      </span>
                    ) : r.ok && r.formData ? (
                      <button
                        onClick={() => setSelected(i)}
                        className="inline-flex items-center gap-1.5 bg-[#7166F0] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#5a52d5] transition-colors"
                      >
                        <PencilLine className="w-4 h-4" /> Review & Edit
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Fix the sheet & re-upload</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show blocking errors for sheets that can't be imported */}
          {results.some((r) => !r.ok) && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 space-y-3">
              {results.filter((r) => !r.ok).map((r, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-red-700">{r.fileName}</p>
                  <ul className="mt-1 space-y-0.5">
                    {r.issues.filter((x) => x.level === "error").map((x, n) => (
                      <li key={n} className="text-sm text-red-600">[{x.field}] {x.message}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
