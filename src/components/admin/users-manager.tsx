"use client";

import { useState } from "react";
import { UserPlus, Mail, Shield, X, Loader2, CheckCircle2, Copy, Check, KeyRound, Link2 } from "lucide-react";

type Role = "SUPER_ADMIN" | "MANAGER" | "AGENT";

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: Role | "CUSTOMER";
  isActive: boolean;
  lastLoginAt: string | null;
  invitedAt: string | null;
  createdAt: string;
  hasPassword: boolean;
}

const ROLE_OPTIONS: { value: Role; label: string; hint: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin", hint: "Full access, incl. users & settings" },
  { value: "MANAGER", label: "Manager", hint: "Properties, builders, bookings, imports" },
  { value: "AGENT", label: "Agent", hint: "View properties & bookings, update status" },
];

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Read-only link with a copy button. Works even where the site can't send email. */
function CopyLinkBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for non-secure contexts / older browsers.
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore — user can still select the text manually */
    }
  }
  return (
    <div className="flex items-stretch gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 bg-slate-50 font-mono"
      />
      <button
        type="button"
        onClick={copy}
        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
          copied ? "bg-green-100 text-green-700" : "bg-[#7166F0] text-white hover:bg-[#5a52d5]"
        }`}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function UsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AdminUserRow[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
  const [showInvite, setShowInvite] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Invite form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("AGENT");
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  // "Reset link" modal for an existing user
  const [resetInfo, setResetInfo] = useState<{ email: string; url: string } | null>(null);
  const [resetBusyId, setResetBusyId] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInviting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not invite user.");
        return;
      }
      setUsers((prev) => [...prev, data.data.user]);
      setInvited(email);
      setInviteUrl(data.data.inviteUrl ?? null);
      setName("");
      setEmail("");
      setRole("AGENT");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setInviting(false);
    }
  }

  async function patchUser(id: string, patch: { role?: Role; isActive?: boolean }) {
    setError(null);
    setBusyId(id);
    // optimistic snapshot for rollback
    const snapshot = users;
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    );
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        setUsers(snapshot); // rollback
        setError(data.error ?? "Could not update user.");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? data.data.user : u)));
    } catch {
      setUsers(snapshot);
      setError("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleResetLink(id: string) {
    setError(null);
    setResetBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/reset-link`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not generate reset link.");
        return;
      }
      setResetInfo({ email: data.data.user.email, url: data.data.resetUrl });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResetBusyId(null);
    }
  }

  function closeInvite() {
    setShowInvite(false);
    setInvited(null);
    setInviteUrl(null);
    setError(null);
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{users.length} team member{users.length === 1 ? "" : "s"}</p>
        <button
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-2 bg-[#7166F0] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a52d5] transition-colors shadow-sm shadow-[#7166F0]/30"
        >
          <UserPlus className="w-4 h-4" />
          Invite user
        </button>
      </div>

      {error && !showInvite && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
              <th className="text-left px-5 py-3">User</th>
              <th className="text-left px-5 py-3">Role</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Last login</th>
              <th className="text-right px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const pending = !u.hasPassword;
              return (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900 leading-tight">
                      {u.name} {isSelf && <span className="text-xs font-normal text-slate-400">(you)</span>}
                    </p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={u.role}
                      disabled={busyId === u.id || isSelf}
                      onChange={(e) => patchUser(u.id, { role: e.target.value as Role })}
                      className={`text-xs font-medium rounded-lg px-2.5 py-1.5 border border-slate-200 bg-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#7166F0]/30`}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                      {u.role === "CUSTOMER" && <option value="CUSTOMER">Customer</option>}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    {pending ? (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Invite pending
                      </span>
                    ) : u.isActive ? (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                        Deactivated
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-slate-600">{fmtDate(u.lastLoginAt)}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-3 justify-end">
                      <button
                        onClick={() => handleResetLink(u.id)}
                        disabled={resetBusyId === u.id}
                        title="Generate a set-password link to share"
                        className="text-xs font-medium text-[#7166F0] hover:underline disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        {resetBusyId === u.id ? "…" : pending ? "Invite link" : "Reset link"}
                      </button>
                      {isSelf ? (
                        <span className="text-xs text-slate-300">—</span>
                      ) : (
                        <button
                          onClick={() => patchUser(u.id, { isActive: !u.isActive })}
                          disabled={busyId === u.id}
                          className={`text-xs font-medium hover:underline disabled:opacity-50 ${
                            u.isActive ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {busyId === u.id ? "…" : u.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#7166F0]" /> Invite team member
              </h2>
              <button onClick={closeInvite} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {invited ? (
              <div className="p-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-800">User created — {invited}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Share this link so they can set their password (also emailed if email is configured).
                  </p>
                </div>
                {inviteUrl && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" /> Invite link (valid 1 hour)
                    </p>
                    <CopyLinkBox url={inviteUrl} />
                  </div>
                )}
                <button
                  onClick={closeInvite}
                  className="mt-5 w-full bg-[#7166F0] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a52d5] transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="p-5 space-y-4">
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7166F0]/30 focus:border-[#7166F0]"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7166F0]/30 focus:border-[#7166F0]"
                      placeholder="jane@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                  <div className="space-y-2">
                    {ROLE_OPTIONS.map((r) => (
                      <label
                        key={r.value}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          role === r.value ? "border-[#7166F0] bg-[#7166F0]/5" : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r.value}
                          checked={role === r.value}
                          onChange={() => setRole(r.value)}
                          className="mt-0.5 accent-[#7166F0]"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{r.label}</p>
                          <p className="text-xs text-slate-500">{r.hint}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#7166F0] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a52d5] transition-colors disabled:opacity-60"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {inviting ? "Sending invite…" : "Send invite"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reset-link result modal */}
      {resetInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#7166F0]" /> Password reset link
              </h2>
              <button onClick={() => setResetInfo(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600">
                Share this link with <strong>{resetInfo.email}</strong> so they can set a new
                password (also emailed if email is configured). Valid for 1 hour.
              </p>
              <div className="mt-4">
                <CopyLinkBox url={resetInfo.url} />
              </div>
              <button
                onClick={() => setResetInfo(null)}
                className="mt-5 w-full bg-[#7166F0] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a52d5] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
