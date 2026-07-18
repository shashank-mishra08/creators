import { ReactNode } from "react";
import { headers } from "next/headers";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { getCurrentAdmin } from "@/lib/auth/roles";

export const metadata = {
  title: "Admin Panel | Creators",
  description: "Creators Admin Dashboard",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Login page renders without the shell (it's a standalone page)
  const headersList = headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Best-effort: used only to tailor the sidebar/header to the signed-in admin.
  // Never gates access here (middleware + per-route guards do that).
  const current = await getCurrentAdmin();

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-slate-900 font-sans">
      <AdminSidebar role={current?.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader user={current ? { name: current.name, role: current.role } : undefined} />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
