import type { Metadata } from "next";
import { ShieldCheck, BarChart3, Building2 } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin Login | Creators",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#7166F0] via-[#5a52d5] to-[#3d38a8] flex-col justify-between p-12 text-white">
        {/* Soft decorative glows */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/creators-logo.png"
            alt="Creators"
            className="w-[180px] h-auto object-contain brightness-0 invert"
          />
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-tight">
            Manage your properties,
            <br />
            smarter.
          </h2>
          <p className="text-white/70 text-sm mt-3 max-w-sm">
            The Creators admin panel — listings, leads, and your team, all in one place.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: Building2, text: "Add & manage every project" },
              { icon: BarChart3, text: "Track site-visit leads in real time" },
              { icon: ShieldCheck, text: "Role-based access for your team" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-white/85 text-sm">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4" />
                </div>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="relative z-10 text-white/50 text-xs">
          Creators Arena Admin — Authorized personnel only
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Logo (mobile only, since the brand panel is hidden) */}
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="bg-[#7166F0] rounded-2xl px-6 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/creators-logo.png"
                alt="Creators"
                className="w-[150px] h-auto object-contain brightness-0 invert"
              />
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">
              Sign in to your Creators admin account.
            </p>
          </div>

          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
