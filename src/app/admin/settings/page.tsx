import { getCurrentAdmin } from "@/lib/auth/roles";
import { settingsService } from "@/lib/services/settings.service";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const current = await getCurrentAdmin();
  const settings = await settingsService.get();
  const canEdit = current?.role === "SUPER_ADMIN";

  // Never send internal fields to the client.
  const { updatedAt, ...rest } = settings;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Global configuration for the public website.
          {!canEdit && " (Read-only — only Super Admins can edit.)"}
        </p>
      </div>
      <SettingsForm initial={rest} canEdit={canEdit} />
    </div>
  );
}
