import { getCurrentAdmin } from "@/lib/auth/roles";
import { settingsService, sanitizeCustomFields } from "@/lib/services/settings.service";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const current = await getCurrentAdmin();
  const settings = await settingsService.get();
  const canEdit = current?.role === "SUPER_ADMIN";

  // Never send internal fields to the client; normalise the JSON custom-fields
  // column into a clean typed array the form can bind to.
  const { updatedAt, footerCustomFields, ...rest } = settings;
  const initial = { ...rest, footerCustomFields: sanitizeCustomFields(footerCustomFields) };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Global configuration for the public website.
          {!canEdit && " (Read-only — only Super Admins can edit.)"}
        </p>
      </div>
      <SettingsForm initial={initial} canEdit={canEdit} />
    </div>
  );
}
