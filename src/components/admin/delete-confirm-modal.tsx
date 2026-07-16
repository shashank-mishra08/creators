"use client";

import { useState, useRef, useEffect } from "react";
import { AlertTriangle, X, Trash2 } from "lucide-react";

interface DeleteConfirmModalProps {
  propertyName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  propertyName,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when modal opens
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const matches = inputValue.trim() === propertyName.trim();

  async function handleDelete() {
    if (!matches) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Delete Property</h2>
            <p className="text-sm text-slate-500">This action cannot be undone.</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
          <p className="text-sm text-slate-700">
            You are about to permanently delete{" "}
            <span className="font-bold text-slate-900">&ldquo;{propertyName}&rdquo;</span>.
            All related data (floor plans, amenities, media, configurations) will be
            permanently removed.
          </p>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Type{" "}
            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
              {propertyName}
            </span>{" "}
            to confirm:
          </label>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type the property name exactly..."
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all"
          />
          {inputValue && !matches && (
            <p className="text-xs text-red-500 mt-1.5">Name does not match. Please type it exactly.</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!matches || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-pulse">Deleting...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
