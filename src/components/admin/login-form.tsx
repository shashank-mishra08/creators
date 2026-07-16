"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed. Please try again.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="admin-email">
          Email address
        </label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@creatorshome.in"
          required
          autoComplete="email"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition-all bg-slate-50 focus:bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="admin-password">
          Password
        </label>
        <div className="relative">
          <input
            id="admin-password"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition-all bg-slate-50 focus:bg-white"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-brand-purple text-white py-3 rounded-xl text-sm font-semibold hover:bg-brand-purple/90 transition-colors shadow-md shadow-brand-purple/20 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="animate-pulse">Signing in...</span>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            Sign in to Admin Panel
          </>
        )}
      </button>
    </form>
  );
}
