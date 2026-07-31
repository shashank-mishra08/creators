"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus, Search, Eye, EyeOff, Pencil, Trash2,
  Building2, RefreshCw, FileSpreadsheet, Undo2
} from "lucide-react";
import { DeleteConfirmModal } from "@/components/admin/delete-confirm-modal";
import { useCan } from "@/components/admin/role-context";

interface AdminProperty {
  id: string;
  name: string;
  slug: string;
  city: string;
  locality: string;
  kind: string;
  possession: string;
  hidden: boolean;
  /** Non-null = in Recently Deleted (soft-deleted, restorable). */
  deletedAt: string | null;
  builderName: string;
  priceRangeLabel: string;
  coverImage: string;
  gradientFrom: string;
  gradientTo: string;
  createdAt: string;
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Same permission table the API enforces, so a button is never offered that
  // would come back 403. The API remains the boundary; this is the courtesy.
  const allowed = useCan();
  // Seeded from ?q= so the header search can hand a term over to this list.
  const [search, setSearch] = useState("");
  // The sidebar links here with ?status=deleted, so Recently Deleted is
  // reachable as its own destination rather than only as a chip on this page.
  const searchParams = useSearchParams();
  const initialStatus =
    searchParams.get("status") === "deleted" ? "deleted" : "all";
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "hidden" | "deleted"
  >(initialStatus);

  // Follow ?q= whenever it changes: the header search pushes a new URL while
  // this page is already mounted, so reading it once at mount is not enough.
  const urlQuery = searchParams.get("q") ?? "";
  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery]);
  const [deleteTarget, setDeleteTarget] = useState<AdminProperty | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<AdminProperty | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/properties");
      if (!res.ok) throw new Error("Failed to fetch properties");
      const data = await res.json();
      setProperties(data.data?.properties ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const filtered = properties.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.builderName.toLowerCase().includes(search.toLowerCase()) ||
      p.locality.toLowerCase().includes(search.toLowerCase());
    // Deleted rows are their own bucket — they must never bleed into all/
    // active/hidden, otherwise "All" would silently list the trash.
    const isDeleted = Boolean(p.deletedAt);
    const matchStatus =
      statusFilter === "deleted"
        ? isDeleted
        : !isDeleted &&
          (statusFilter === "all" ||
            (statusFilter === "active" && !p.hidden) ||
            (statusFilter === "hidden" && p.hidden));
    return matchSearch && matchStatus;
  });

  const deletedCount = properties.filter((p) => p.deletedAt).length;

  async function toggleVisibility(prop: AdminProperty) {
    setTogglingId(prop.id);
    try {
      const res = await fetch(`/api/admin/properties/${prop.id}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !prop.hidden }),
      });
      if (!res.ok) throw new Error("Failed to update visibility");
      setProperties((prev) =>
        prev.map((p) => (p.id === prop.id ? { ...p, hidden: !prop.hidden } : p))
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setTogglingId(null);
    }
  }

  /** Moves the property to Recently Deleted — reversible via `restore`. */
  async function handleDelete(prop: AdminProperty) {
    const res = await fetch(`/api/admin/properties/${prop.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmName: prop.name }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Delete failed");
    }
    // Keep the row in state, now flagged as deleted, so it appears under the
    // Deleted filter immediately instead of vanishing.
    setProperties((prev) =>
      prev.map((p) =>
        p.id === prop.id ? { ...p, deletedAt: new Date().toISOString() } : p,
      ),
    );
    setDeleteTarget(null);
  }

  async function handleRestore(prop: AdminProperty) {
    setTogglingId(prop.id);
    try {
      const res = await fetch(`/api/admin/properties/${prop.id}/restore`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Restore failed");
      }
      setProperties((prev) =>
        prev.map((p) => (p.id === prop.id ? { ...p, deletedAt: null } : p)),
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Restore failed");
    } finally {
      setTogglingId(null);
    }
  }

  /** Irreversible. Only reachable for rows already in Recently Deleted. */
  async function handlePurge(prop: AdminProperty) {
    const res = await fetch(`/api/admin/properties/${prop.id}/purge`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmName: prop.name }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Delete failed");
    }
    setProperties((prev) => prev.filter((p) => p.id !== prop.id));
    setPurgeTarget(null);
  }

  /**
   * Two chips, because these are two different questions.
   *
   * One column used to answer both, and the lifecycle checks ran first — so an
   * Under Construction project showed red when deleted, grey when hidden and
   * orange otherwise. The colour looked random because it was never about
   * construction. "Ready to Move" was also labelled "Active", which reads as a
   * visibility state, so a live under-construction project looked inactive.
   */
  const lifecycleBadge = (p: AdminProperty) => {
    if (p.deletedAt) return { label: "Deleted", cls: "bg-red-100 text-red-700" };
    if (p.hidden) return { label: "Hidden", cls: "bg-slate-100 text-slate-500" };
    return { label: "Live", cls: "bg-green-100 text-green-700" };
  };

  const possessionBadge = (p: AdminProperty) => {
    if (p.possession === "Ready to Move") return { label: "Ready to Move", cls: "bg-teal-100 text-teal-700" };
    if (p.possession === "Under Construction") return { label: "Under Construction", cls: "bg-orange-100 text-orange-700" };
    if (p.possession === "New Launch") return { label: "New Launch", cls: "bg-blue-100 text-blue-700" };
    return { label: p.possession || "—", cls: "bg-slate-100 text-slate-600" };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Properties</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {properties.length} total · {properties.filter((p) => !p.hidden).length} visible
          </p>
        </div>
        <div className="flex items-center gap-3">
          {allowed("import", "run") && (
          <Link
            href="/admin/import"
            className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Import from Excel
          </Link>
          )}
          {allowed("properties", "create") && (
          <Link
            href="/admin/properties/add"
            className="inline-flex items-center gap-2 bg-[#7166F0] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a52d5] transition-colors shadow-sm shadow-[#7166F0]/30"
          >
            <Plus className="w-4 h-4" />
            Add New Property
          </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, builder, or location..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7166F0]/20 focus:border-[#7166F0] transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "hidden", "deleted"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors ${
                statusFilter === f
                  ? "bg-[#7166F0] text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f === "deleted" ? "Recently Deleted" : f}
              {f === "deleted" && deletedCount > 0 && (
                <span
                  className={`ml-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                    statusFilter === f
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {deletedCount}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={fetchProperties}
            className="px-3 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" />
            Loading properties...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <p className="text-red-500 mb-3">{error}</p>
            <button onClick={fetchProperties} className="text-sm text-[#7166F0] hover:underline">
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Building2 className="w-10 h-10 mb-3 opacity-40" />
            <p>No properties found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3">Property</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Location</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Builder</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3 hidden xl:table-cell">Price</th>
                  <th className="text-center px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((prop) => {
                  const life = lifecycleBadge(prop);
                  const poss = possessionBadge(prop);
                  const isToggling = togglingId === prop.id;
                  return (
                    <tr key={prop.id} className={`hover:bg-slate-50/50 transition-colors ${prop.hidden ? "opacity-60" : ""}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {prop.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={prop.coverImage}
                              alt={prop.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                              style={{ background: `linear-gradient(135deg, #7166F0, #5a52d5)` }}
                            >
                              {prop.name[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{prop.name}</p>
                            <p className="text-xs text-slate-400">{prop.kind}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <p className="text-sm text-slate-700">{prop.locality}</p>
                        <p className="text-xs text-slate-400">{prop.city}</p>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <p className="text-sm text-slate-700">{prop.builderName}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${life.cls}`}>
                            {life.label}
                          </span>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${poss.cls}`}>
                            {poss.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden xl:table-cell">
                        <p className="text-sm text-slate-700">{prop.priceRangeLabel || "—"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {prop.deletedAt ? (
                            <>
                              {allowed("trash", "restore") && (
                              <button
                                onClick={() => handleRestore(prop)}
                                disabled={isToggling}
                                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-green-200 text-green-600 text-xs font-semibold hover:bg-green-500 hover:text-white hover:border-green-500 transition-all disabled:opacity-50"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                                Restore
                              </button>
                              )}
                              {allowed("trash", "purge") && (
                              <button
                                onClick={() => setPurgeTarget(prop)}
                                title="Delete permanently"
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              )}
                            </>
                          ) : (
                            <>
                              {allowed("properties", "edit") && (
                              <Link
                                href={`/admin/properties/${prop.id}/edit`}
                                title="Edit"
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-[#7166F0] hover:text-white hover:border-[#7166F0] transition-all"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Link>
                              )}
                              {allowed("properties", "edit") && (
                              <button
                                onClick={() => toggleVisibility(prop)}
                                disabled={isToggling}
                                title={prop.hidden ? "Show property" : "Hide property"}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all disabled:opacity-50 ${
                                  prop.hidden
                                    ? "border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500"
                                    : "border-green-200 text-green-500 hover:bg-green-500 hover:text-white hover:border-green-500"
                                }`}
                              >
                                {prop.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              )}
                              {allowed("properties", "delete") && (
                              <button
                                onClick={() => setDeleteTarget(prop)}
                                title="Delete property"
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Modal — soft delete, recoverable from Recently Deleted */}
      {deleteTarget && (
        <DeleteConfirmModal
          propertyName={deleteTarget.name}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Purge Modal — permanent, cascades across all related records */}
      {purgeTarget && (
        <DeleteConfirmModal
          propertyName={purgeTarget.name}
          onConfirm={() => handlePurge(purgeTarget)}
          onCancel={() => setPurgeTarget(null)}
        />
      )}
    </div>
  );
}
