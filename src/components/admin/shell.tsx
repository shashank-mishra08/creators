"use client";

import { ReactNode, useCallback, useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { AdminRoleProvider } from "@/components/admin/role-context";

/**
 * Client shell for the admin panel. The layout is a server component, so the
 * mobile drawer state has to live here — it's the one piece the sidebar and the
 * header both need.
 */
export function AdminShell({
  role,
  user,
  children,
}: {
  role?: string;
  user?: { name: string; role: string };
  children: ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  // Stable identity — the sidebar keys effects off this, so a fresh closure on
  // every render would tear down and re-arm its listeners needlessly.
  const closeNav = useCallback(() => setNavOpen(false), []);

  return (
    <AdminRoleProvider role={role}>
    <div className="flex min-h-screen bg-[#F8F9FA] text-slate-900 font-sans">
      <AdminSidebar role={role} open={navOpen} onClose={closeNav} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader user={user} onMenuClick={() => setNavOpen(true)} />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
    </AdminRoleProvider>
  );
}
