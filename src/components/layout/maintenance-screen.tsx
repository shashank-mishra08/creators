import { Wrench } from "lucide-react";

/**
 * Shown to public visitors when maintenance mode is enabled in Settings.
 * The admin panel (/admin/*) bypasses this, so staff can always turn it off.
 * Self-contained styling — renders without the normal site shell/providers.
 */
export function MaintenanceScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#7166F0]/10 text-[#7166F0] flex items-center justify-center mb-6">
        <Wrench className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">We&apos;ll be back soon</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-md">
        Our site is undergoing scheduled maintenance. Please check back shortly —
        thank you for your patience.
      </p>
    </div>
  );
}
