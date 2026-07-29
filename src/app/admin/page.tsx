import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import {
  Building2, Eye, HardHat, EyeOff,
  Plus, ArrowRight, TrendingUp,
} from "lucide-react";

async function getDashboardData() {
  // Soft-deleted properties live in Recently Deleted, not on the dashboard.
  const properties = await prisma.property.findMany({
    where: { deletedAt: null },
    include: {
      builder: { select: { name: true } },
      pricing: { select: { priceRangeLabel: true } },
      media: { where: { type: "cover" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: properties.length,
    active: properties.filter((p) => !p.hidden).length,
    hidden: properties.filter((p) => p.hidden).length,
    underConstruction: properties.filter(
      (p) => p.possession === "Under Construction" && !p.hidden
    ).length,
  };

  const recent = properties.slice(0, 8);
  return { stats, recent };
}

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { stats, recent } = await getDashboardData();

  const statCards = [
    {
      label: "Total Properties",
      value: stats.total,
      icon: Building2,
      color: "bg-blue-50 text-blue-600",
      change: "All properties",
    },
    {
      label: "Active / Visible",
      value: stats.active,
      icon: Eye,
      color: "bg-green-50 text-green-600",
      change: "Shown on website",
    },
    {
      label: "Under Construction",
      value: stats.underConstruction,
      icon: HardHat,
      color: "bg-orange-50 text-orange-600",
      change: "Active listings",
    },
    {
      label: "Hidden",
      value: stats.hidden,
      icon: EyeOff,
      color: "bg-slate-100 text-slate-600",
      change: "Not visible to public",
    },
  ];

  const possessionBadge = (p: string, hidden: boolean) => {
    if (hidden) return { label: "Hidden", cls: "bg-slate-100 text-slate-500" };
    if (p === "Ready to Move") return { label: "Active", cls: "bg-green-100 text-green-700" };
    if (p === "Under Construction") return { label: "Under Construction", cls: "bg-orange-100 text-orange-700" };
    return { label: p, cls: "bg-blue-100 text-blue-700" };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        <Link
          href="/admin/properties/add"
          className="inline-flex items-center gap-2 bg-[#7166F0] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a52d5] transition-colors shadow-sm shadow-[#7166F0]/30"
        >
          <Plus className="w-4 h-4" />
          Add New Property
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <TrendingUp className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="text-sm font-medium text-slate-700 mt-0.5">{card.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.change}</p>
          </div>
        ))}
      </div>

      {/* Recent Properties Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Recent Properties</h2>
          <Link
            href="/admin/properties"
            className="text-sm text-[#7166F0] font-medium hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <th className="text-left px-5 py-3">Property</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Location</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">Builder</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Price</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recent.map((prop) => {
                const badge = possessionBadge(prop.possession, prop.hidden);
                return (
                  <tr key={prop.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {prop.media[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prop.media[0].url}
                            alt={prop.name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-100"
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: `linear-gradient(135deg, ${prop.gradientFrom}, ${prop.gradientTo})` }}
                          >
                            {prop.name[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-900 leading-tight">{prop.name}</p>
                          <p className="text-xs text-slate-400">{prop.kind}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-sm text-slate-700">{prop.locality}</p>
                      <p className="text-xs text-slate-400">{prop.city}</p>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <p className="text-sm text-slate-700">{prop.builder.name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-900">
                        {prop.pricing?.priceRangeLabel || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/properties/${prop.id}/edit`}
                        className="text-xs font-medium text-[#7166F0] hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
