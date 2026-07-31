import { ShieldAlert } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth/roles";
import { can } from "@/lib/auth/permissions";
import { settingsService, sanitizeCustomFields } from "@/lib/services/settings.service";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const current = await getCurrentAdmin();

  // The API refuses to read settings without this permission, so the page must
  // not render them either — otherwise the panel shows what the API hides.
  if (!current || !can(current.role, "settings", "view")) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Restricted area</h1>
          <p className="text-sm text-slate-500 mt-1">
            You don&apos;t have access to site settings.
          </p>
        </div>
      </div>
    );
  }

  const settings = await settingsService.get();
  const canEdit = can(current.role, "settings", "edit");

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
