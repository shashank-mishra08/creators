import { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
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

  // Authorization chokepoint for the WHOLE admin panel. The Edge middleware only
  // checks that a session cookie exists (it can't hit the DB), so a logged-in
  // NON-admin (e.g. a public customer) could otherwise reach admin pages that
  // fetch data server-side (dashboard, bookings…). Verifying here — once, in the
  // shared layout — protects every admin page in a single place. A real admin
  // passes through unchanged; anyone else is sent to the login screen.
  const current = await getCurrentAdmin();
  if (!current) {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      role={current?.role}
      user={current ? { name: current.name, role: current.role } : undefined}
    >
      {children}
    </AdminShell>
  );
}
