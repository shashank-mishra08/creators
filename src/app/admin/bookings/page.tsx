import { prisma } from "@/lib/db/prisma";
import { CalendarCheck, Phone, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

/** Format a yyyy-mm-dd string as a readable date without timezone drift. */
function formatVisitDate(d: string) {
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminBookingsPage() {
  const bookings = await prisma.siteVisitBooking.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Contact Query</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Booking requests submitted by clients from the website.
        </p>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#7166F0]/10 text-[#7166F0]">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{bookings.length}</p>
          <p className="text-sm font-medium text-slate-700 mt-0.5">Total Requests</p>
          <p className="text-xs text-slate-400 mt-0.5">All contact queries</p>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">All Bookings</h2>
        </div>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">No bookings yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Requests from the &ldquo;Contact Query&rdquo; form will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="text-left px-5 py-3">Client</th>
                  <th className="text-left px-5 py-3">Property</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Requested Visit</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-900 leading-tight">{b.name}</p>
                      <a
                        href={`tel:${b.phone}`}
                        className="text-xs text-[#7166F0] hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" /> {b.phone}
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700 inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> {b.propertyName}
                      </p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-sm font-medium text-slate-900">{formatVisitDate(b.visitDate)}</p>
                      <p className="text-xs text-slate-400">{b.visitTime}</p>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <p className="text-sm text-slate-700">
                        {b.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </td>
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
