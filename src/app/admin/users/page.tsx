import { ShieldAlert } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth/roles";
import { adminUserService } from "@/lib/services/admin-user.service";
import { UsersManager } from "@/components/admin/users-manager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const current = await getCurrentAdmin();

  // Only Super Admins manage users. Everyone else sees a friendly notice
  // (the API routes enforce this independently).
  if (!current || current.role !== "SUPER_ADMIN") {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Restricted area</h1>
          <p className="text-sm text-slate-500 mt-1">
            Only Super Admins can manage users and roles.
          </p>
        </div>
      </div>
    );
  }

  const users = await adminUserService.list();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Users &amp; Roles</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Invite team members and control what they can access.
        </p>
      </div>
      <UsersManager initialUsers={users} currentUserId={current.id} />
    </div>
  );
}
