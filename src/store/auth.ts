"use client";

import { create } from "zustand";

/**
 * Real (basic) auth, backed by the API + PostgreSQL.
 *
 *   useAuth ──► /api/auth/* ──► auth.service ──► user.repository ──► Postgres
 *
 * The session lives in an httpOnly cookie (set server-side), so accounts and
 * saved properties persist per user and are restored on `hydrate()` at load.
 */
export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  /** current user's saved (shortlisted) property ids */
  savedIds: string[];
  error: string | null;
  /** true once the initial /me hydration has completed */
  ready: boolean;
  hydrate: () => Promise<void>;
  signup: (
    name: string,
    email: string,
    phone: string,
    password: string,
  ) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  toggleShortlist: (propertyId: string) => Promise<boolean>;
  setError: (e: string | null) => void;
}

async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  savedIds: [],
  error: null,
  ready: false,

  hydrate: async () => {
    try {
      const res = await fetch("/api/auth/me");
      const body = await res.json();
      const u = body?.data;
      if (u)
        set({ user: { id: u.id, name: u.name, email: u.email }, savedIds: u.savedPropertyIds ?? [] });
      else set({ user: null, savedIds: [] });
    } catch {
      // network/hydration failure → treat as logged-out
    } finally {
      set({ ready: true });
    }
  },

  signup: async (name, email, phone, password) => {
    const { ok, data } = await postJson("/api/auth/signup", {
      name,
      email,
      phone,
      password,
    });
    if (!ok) {
      set({ error: data?.error ?? "Sign up failed. Please try again." });
      return false;
    }
    const u = data.data;
    set({ user: { id: u.id, name: u.name, email: u.email }, savedIds: u.savedPropertyIds ?? [], error: null });
    return true;
  },

  login: async (email, password) => {
    const { ok, data } = await postJson("/api/auth/login", { email, password });
    if (!ok) {
      set({ error: data?.error ?? "Invalid email or password." });
      return false;
    }
    const u = data.data;
    set({ user: { id: u.id, name: u.name, email: u.email }, savedIds: u.savedPropertyIds ?? [], error: null });
    return true;
  },

  logout: async () => {
    set({ user: null, savedIds: [], error: null });
    await postJson("/api/auth/logout").catch(() => {});
  },

  toggleShortlist: async (propertyId) => {
    const { user, savedIds } = get();
    if (!user) return false;
    // optimistic update, reconciled with the server response
    const optimistic = savedIds.includes(propertyId)
      ? savedIds.filter((x) => x !== propertyId)
      : [...savedIds, propertyId];
    set({ savedIds: optimistic });
    const { ok, data } = await postJson("/api/auth/saved", { propertyId });
    if (ok && data?.data?.savedPropertyIds) set({ savedIds: data.data.savedPropertyIds });
    else set({ savedIds }); // revert on failure
    return true;
  },

  setError: (e) => set({ error: e }),
}));

/* ---- selector helpers (reactive slices) --------------------------------- */
export const selectShortlistIds = (s: AuthState) => s.savedIds;
