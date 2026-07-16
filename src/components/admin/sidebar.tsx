"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Building2, PlusCircle, Users, MapPin, Star,
  LayoutDashboard, Image as ImageIcon, MessageSquare,
  Mail, CalendarCheck, PhoneCall, UserCog, Settings,
  ChevronLeft, FileSpreadsheet
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    title: "PROPERTY MANAGEMENT",
    items: [
      { name: "Properties", href: "/admin/properties", icon: Home },
      { name: "Add Property", href: "/admin/properties/add", icon: PlusCircle },
      { name: "Import from Excel", href: "/admin/import", icon: FileSpreadsheet },
    ]
  },
  {
    title: "CLIENT ENGAGEMENT",
    items: [
      { name: "Site Visits", href: "/admin/bookings", icon: CalendarCheck },
    ]
  },
  {
    title: "SETTINGS",
    items: [
      { name: "Users & Roles", href: "/admin/users", icon: UserCog },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] bg-white border-r flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo Area */}
      <div className="h-20 flex items-center justify-center bg-[#7166F0] border-b border-[#5a52d5] text-white">
        <Link href="/admin" className="flex items-center justify-center w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/brand/creators-logo.png" 
            alt="Creators Logo" 
            className="w-[180px] h-auto object-contain brightness-0 invert transition-transform hover:scale-105"
          />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {/* Dashboard Main Link */}
        <div className="px-4 mb-6">
          <Link 
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative",
              pathname === "/admin" 
                ? "bg-[#7166F0]/10 text-brand-purple font-medium" 
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            {pathname === "/admin" && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-brand-purple rounded-r-md" />
            )}
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Navigation Groups */}
        <div className="px-4 space-y-8">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h3 className="px-4 text-[11px] font-semibold text-slate-400 tracking-wider mb-3">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors relative text-sm",
                        isActive
                          ? "bg-[#7166F0]/10 text-brand-purple font-medium"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-purple rounded-r-md" />
                      )}
                      <item.icon className="w-[18px] h-[18px]" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collapse Button */}
      <div className="p-4 border-t">
        <button className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-900 transition-colors text-sm w-full">
          <ChevronLeft className="w-5 h-5" />
          <span>Collapse</span>
        </button>
      </div>
    </aside>
  );
}
