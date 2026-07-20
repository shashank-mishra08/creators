import { ShieldAlert, ScrollText } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth/roles";
import { listRecentAudit } from "@/lib/services/audit.service";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  AGENT: "Agent",
};

function fmt(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default async function AdminAuditPage() {
  const current = await getCurrentAdmin();

  if (!current || current.role !== "SUPER_ADMIN") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Restricted area</h1>
          <p className="text-sm text-slate-500 mt-1">Only Super Admins can view the activity log.</p>
        </div>
      </div>
    );
  }

  const rows = await listRecentAudit(200);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          A record of admin actions across the panel.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <ScrollText className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">No activity yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Actions like inviting users or editing settings will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="text-left px-5 py-3">When</th>
                  <th className="text-left px-5 py-3">Who</th>
                  <th className="text-left px-5 py-3">Action</th>
                  <th className="text-left px-5 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">{fmt(r.createdAt)}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-800">{r.actorName}</p>
                      {r.actorRole && (
                        <p className="text-xs text-slate-400">{ROLE_LABEL[r.actorRole] ?? r.actorRole}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 font-mono">
                        {r.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">{r.summary || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
