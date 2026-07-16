import { ReactNode } from "react";
import { headers } from "next/headers";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";

export const metadata = {
  title: "Admin Panel | Creators",
  description: "Creators Admin Dashboard",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Login page renders without the shell (it's a standalone page)
  const headersList = headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-slate-900 font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
