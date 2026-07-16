"use client";

import * as React from "react";
import {
  UploadCloud, FileSpreadsheet, Loader2, CheckCircle2,
  AlertTriangle, XCircle, RefreshCw,
} from "lucide-react";

type Issue = { level: "error" | "warning"; field: string; message: string };
type Summary = {
  name: string; builder: string; city: string; locality: string;
  possession: string; priceRange: string; configs: string[];
  towers: number; amenities: number; attributes: number; isUpdate: boolean;
};
type Report = {
  status: "success" | "partial" | "failed";
  created: number; updated: number; skipped: number; warnings: number; issues: Issue[];
};
type Phase = "idle" | "previewing" | "preview" | "committing" | "done" | "error";

export default function AdminImportPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [issues, setIssues] = React.useState<Issue[]>([]);
  const [ok, setOk] = React.useState(false);
  const [report, setReport] = React.useState<Report | null>(null);
  const [error, setError] = React.useState("");

  const reset = () => {
    setFile(null); setPhase("idle"); setSummary(null);
    setIssues([]); setOk(false); setReport(null); setError("");
  };

  const send = async (f: File, mode: "preview" | "commit") => {
    const fd = new FormData();
    fd.append("file", f);
    fd.append("mode", mode);
    const res = await fetch("/api/admin/import", { method: "POST", body: fd });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || "Request failed");
    return body.data;
  };

  const onSelect = async (f?: File) => {
    if (!f) return;
    setFile(f); setError(""); setReport(null); setPhase("previewing");
    try {
      const data = await send(f, "preview");
      setSummary(data.summary);
      setIssues(data.issues || []);
      setOk(data.ok);
      setPhase("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
      setPhase("error");
    }
  };

  const onConfirm = async () => {
    if (!file) return;
    setPhase("committing");
    try {
      const data = await send(file, "commit");
      setReport(data.report);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
      setPhase("error");
    }
  };

  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Import from Excel</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Upload a property sheet (.xlsx). Review the extracted details, then publish to the live site.
        </p>
      </div>

      {/* Upload box */}
      {phase === "idle" && (
        <label className="flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center cursor-pointer hover:border-[#7166F0] hover:bg-[#7166F0]/[0.02] transition-colors">
          <div className="w-14 h-14 rounded-full bg-[#7166F0]/10 flex items-center justify-center text-[#7166F0]">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Choose an Excel file</p>
            <p className="text-xs text-slate-400 mt-0.5">Only .xlsx · up to 10MB</p>
          </div>
          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => onSelect(e.target.files?.[0])}
          />
        </label>
      )}

      {/* Selected file bar */}
      {file && phase !== "idle" && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
          </div>
          <button
            onClick={reset}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Choose another
          </button>
        </div>
      )}

      {/* Loading */}
      {(phase === "previewing" || phase === "committing") && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          {phase === "previewing" ? "Reading & validating sheet…" : "Publishing to live site…"}
        </div>
      )}

      {/* Error */}
      {phase === "error" && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-5">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Something went wrong</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {phase === "preview" && summary && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Extracted details</h2>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${summary.isUpdate ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                {summary.isUpdate ? "Will UPDATE existing property" : "Will ADD new property"}
              </span>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 p-5">
              {[
                ["Project", summary.name],
                ["Builder", summary.builder],
                ["City", summary.city],
                ["Locality", summary.locality],
                ["Possession", summary.possession],
                ["Price range", summary.priceRange || "—"],
                ["Configurations", `${summary.configs.length}`],
                ["Towers", `${summary.towers}`],
                ["Amenities", `${summary.amenities}`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-400">{label}</dt>
                  <dd className="text-sm font-medium text-slate-800 mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
            {summary.configs.length > 0 && (
              <div className="px-5 pb-5 flex flex-wrap gap-2">
                {summary.configs.map((c) => (
                  <span key={c} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{c}</span>
                ))}
              </div>
            )}
          </div>

          {/* Errors block validation */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
              <p className="text-sm font-semibold text-red-700 flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4" /> {errors.length} error(s) — fix these before publishing
              </p>
              <ul className="space-y-1">
                {errors.map((i, n) => (
                  <li key={n} className="text-sm text-red-600">[{i.field}] {i.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings are non-blocking */}
          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <p className="text-sm font-semibold text-amber-700 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> {warnings.length} warning(s) — you can still publish
              </p>
              <ul className="space-y-1">
                {warnings.map((i, n) => (
                  <li key={n} className="text-sm text-amber-700">[{i.field}] {i.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onConfirm}
              disabled={!ok}
              className="inline-flex items-center gap-2 bg-[#7166F0] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a52d5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm & Publish
            </button>
            <button onClick={reset} className="text-sm font-medium text-slate-500 hover:text-slate-900">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Done */}
      {phase === "done" && report && (
        <div className={`rounded-2xl border p-6 ${report.status === "failed" ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
          <div className="flex items-center gap-3">
            {report.status === "failed"
              ? <XCircle className="w-6 h-6 text-red-500" />
              : <CheckCircle2 className="w-6 h-6 text-green-600" />}
            <div>
              <p className={`text-base font-semibold ${report.status === "failed" ? "text-red-700" : "text-green-700"}`}>
                {report.status === "failed"
                  ? "Import failed — nothing was published"
                  : report.created ? "Published — new property is now live" : "Published — property updated and live"}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                created {report.created} · updated {report.updated} · skipped {report.skipped} · warnings {report.warnings}
              </p>
            </div>
          </div>
          <button
            onClick={reset}
            className="mt-5 inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50"
          >
            <UploadCloud className="w-4 h-4" /> Import another sheet
          </button>
        </div>
      )}
    </div>
  );
}
