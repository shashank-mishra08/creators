"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  GalleryHorizontalEnd,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { Banner, BannerInput } from "@/lib/types";

const INPUT =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7166F0]/20 focus:border-[#7166F0] transition-all";
const LABEL = "block text-xs font-semibold text-slate-600 mb-1.5";

const EMPTY: BannerInput = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  sortOrder: 0,
  active: true,
  startsAt: null,
  endsAt: null,
};

/** `datetime-local` needs "YYYY-MM-DDTHH:mm"; the API speaks ISO or null. */
const toLocalInput = (iso: string | null) =>
  iso ? new Date(iso).toISOString().slice(0, 16) : "";
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; input: BannerInput } | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/banners");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to load banners");
      setBanners(body.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  async function save() {
    if (!editing) return;
    if (!editing.input.imageUrl) {
      setError("An image is required before saving.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        editing.id ? `/api/admin/banners/${editing.id}` : "/api/admin/banners",
        {
          method: editing.id ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(editing.input),
        },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to save banner");
      setEditing(null);
      await fetchBanners();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/banners/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete banner");
      setDeleteTarget(null);
      await fetchBanners();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  /** Toggling from the list is a one-field save; reuse the same payload shape. */
  async function toggleActive(b: Banner) {
    const { id: _id, ...input } = b;
    await fetch(`/api/admin/banners/${b.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input, active: !b.active }),
    });
    fetchBanners();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Home Banners</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {banners.length} total · {banners.filter((b) => b.active).length} active
            · shown under the hero on the home page
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchBanners}
            title="Refresh"
            className="px-3 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditing({ id: null, input: { ...EMPTY } })}
            className="inline-flex items-center gap-2 bg-[#7166F0] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a52d5] transition-colors shadow-sm shadow-[#7166F0]/30"
          >
            <Plus className="w-4 h-4" />
            Add Banner
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading banners…
          </div>
        ) : banners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <GalleryHorizontalEnd className="h-6 w-6 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">No banners yet</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Add one to promote a new launch or offer. Until then the home page
              shows no banner strip at all.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {banners.map((b) => (
              <li key={b.id} className="flex items-center gap-4 p-4">
                <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {b.imageUrl && (
                    <Image
                      src={b.imageUrl}
                      alt=""
                      fill
                      unoptimized
                      sizes="96px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {b.title || <span className="text-slate-400">Untitled</span>}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {b.subtitle || b.linkUrl || "—"}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                        b.active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {b.active ? "Active" : "Inactive"}
                    </span>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                      Order {b.sortOrder}
                    </span>
                    {(b.startsAt || b.endsAt) && (
                      <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-700">
                        {b.startsAt ? new Date(b.startsAt).toLocaleDateString() : "—"}
                        {" → "}
                        {b.endsAt ? new Date(b.endsAt).toLocaleDateString() : "—"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => toggleActive(b)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    {b.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => {
                      const { id: _id, ...input } = b;
                      setEditing({ id: b.id, input });
                    }}
                    aria-label={`Edit ${b.title || "banner"}`}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#7166F0]"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(b)}
                    aria-label={`Delete ${b.title || "banner"}`}
                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <BannerEditor
          value={editing.input}
          isNew={editing.id === null}
          busy={busy}
          onChange={(input) => setEditing({ ...editing, input })}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}

      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)} title="Delete banner?">
          <p className="text-sm text-slate-600">
            &ldquo;{deleteTarget.title || "Untitled banner"}&rdquo; will be removed
            from the home page immediately. This cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={busy}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function BannerEditor({
  value,
  isNew,
  busy,
  onChange,
  onCancel,
  onSave,
}: {
  value: BannerInput;
  isNew: boolean;
  busy: boolean;
  onChange: (v: BannerInput) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const set = <K extends keyof BannerInput>(key: K, v: BannerInput[K]) =>
    onChange({ ...value, [key]: v });

  async function upload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Upload failed");
      set("imageUrl", body.data?.path ?? "");
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal onClose={onCancel} title={isNew ? "Add banner" : "Edit banner"} wide>
      <div className="space-y-4">
        <div>
          <label className={LABEL}>Banner image *</label>
          <div className="flex items-center gap-3">
            <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {value.imageUrl && (
                <Image
                  src={value.imageUrl}
                  alt=""
                  fill
                  unoptimized
                  sizes="144px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#7166F0] px-3 py-2 text-sm font-semibold text-[#7166F0] transition-colors hover:bg-[#7166F0]/5">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "Uploading…" : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(f);
                  }}
                />
              </label>
              <input
                value={value.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                placeholder="…or paste an image URL"
                className={`${INPUT} mt-2`}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Wide artwork works best — roughly 1600×420.
              </p>
              {uploadError && (
                <p className="mt-1 text-[11px] text-red-600">{uploadError}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Title</label>
            <input
              value={value.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="New launch — Phase 2 open"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Link URL</label>
            <input
              value={value.linkUrl}
              onChange={(e) => set("linkUrl", e.target.value)}
              placeholder="/properties/some-project"
              className={INPUT}
            />
          </div>
        </div>

        <div>
          <label className={LABEL}>Subtitle</label>
          <input
            value={value.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            placeholder="Bookings open from 1 August"
            className={INPUT}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={LABEL}>Sort order</label>
            <input
              type="number"
              min={0}
              value={value.sortOrder}
              onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Starts at (optional)</label>
            <input
              type="datetime-local"
              value={toLocalInput(value.startsAt)}
              onChange={(e) => set("startsAt", fromLocalInput(e.target.value))}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Ends at (optional)</label>
            <input
              type="datetime-local"
              value={toLocalInput(value.endsAt)}
              onChange={(e) => set("endsAt", fromLocalInput(e.target.value))}
              className={INPUT}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={value.active}
            onChange={(e) => set("active", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#7166F0] focus:ring-[#7166F0]"
          />
          Active (show on the home page)
        </label>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={busy || uploading || !value.imageUrl}
          className="rounded-xl bg-[#7166F0] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#7166F0]/30 transition-colors hover:bg-[#5a52d5] disabled:opacity-60"
        >
          {busy ? "Saving…" : isNew ? "Create banner" : "Save changes"}
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ${
          wide ? "max-w-2xl" : "max-w-md"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
