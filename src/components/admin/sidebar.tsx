"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Building2, PlusCircle, Users, MapPin, Star,
  LayoutDashboard, Image as ImageIcon, MessageSquare,
  Mail, CalendarCheck, PhoneCall, UserCog, Settings,
  ChevronLeft, FileSpreadsheet, ScrollText, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

// `roles` (when present) restricts an item to those roles. Items without a
// `roles` field are visible to every admin. If no role is passed to the
// sidebar we fail open (show everything) so nothing disappears unexpectedly.
type NavItem = {
  name: string;
  href: string;
  icon: typeof Home;
  roles?: string[];
};

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "PROPERTY MANAGEMENT",
    items: [
      { name: "Properties", href: "/admin/properties", icon: Home },
      { name: "Add Property", href: "/admin/properties/add", icon: PlusCircle },
      { name: "Import from Excel", href: "/admin/import", icon: FileSpreadsheet },
      { name: "Home Banners", href: "/admin/banners", icon: ImageIcon },
      { name: "Recently Deleted", href: "/admin/properties?status=deleted", icon: Trash2 },
    ]
  },
  {
    title: "CLIENT ENGAGEMENT",
    items: [
      { name: "Contact Query", href: "/admin/bookings", icon: CalendarCheck },
    ]
  },
  {
    title: "SETTINGS",
    items: [
      { name: "Users & Roles", href: "/admin/users", icon: UserCog, roles: ["SUPER_ADMIN"] },
      { name: "Activity Log", href: "/admin/audit", icon: ScrollText, roles: ["SUPER_ADMIN"] },
      { name: "Settings", href: "/admin/settings", icon: Settings, roles: ["SUPER_ADMIN"] },
    ]
  }
];

export function AdminSidebar({
  role,
  open = false,
  onClose,
}: {
  role?: string;
  /** Mobile drawer state. Ignored from `lg` up, where the rail is always shown. */
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const canSee = (item: NavItem) =>
    !item.roles || !role || item.roles.includes(role);

  const visibleGroups = navGroups
    .map((g) => ({ ...g, items: g.items.filter(canSee) }))
    .filter((g) => g.items.length > 0);

  // Navigating on mobile should dismiss the drawer, not leave it covering the page.
  React.useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Escape closes, and the page behind must not scroll while the drawer is open.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <>
      {/* Scrim — mobile only, sits under the drawer. */}
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "bg-white flex flex-col w-[280px] shrink-0",
          // Mobile: off-canvas drawer. lg+: the original static rail.
          "fixed inset-y-0 left-0 z-50 h-screen transition-transform duration-300 ease-out",
          // Clear the fixed offsets at lg, or `bottom:0` fights sticky positioning.
          "lg:sticky lg:inset-y-auto lg:left-auto lg:top-0 lg:z-auto lg:translate-x-0 lg:transition-none",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
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

      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide border-r">
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
          {visibleGroups.map((group) => (
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

      {/* Closes the mobile drawer. Hidden on lg, where there is nothing to close. */}
      <div className="p-4 border-t border-r lg:hidden">
        <button
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-900 transition-colors text-sm w-full"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Close menu</span>
        </button>
      </div>
      </aside>
    </>
  );
}
