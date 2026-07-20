import type { Metadata } from "next";
import Image from "next/image";
import { AdminLoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin Login | Creators",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    // White fills the whole viewport — no backdrop gutter showing anywhere.
    <div className="min-h-screen w-full bg-white flex items-stretch">
      {/* ── Shell ── */}
      <div
        className="
          w-full bg-white
          p-0 sm:p-2.5 lg:p-3
          grid grid-cols-1 lg:grid-cols-[minmax(0,44%)_minmax(0,1fr)]
          gap-0 lg:gap-4
        "
      >
        {/* ── Left artwork, inset inside the shell ── */}
        <div className="relative hidden lg:block rounded-2xl overflow-hidden bg-[#0B0718]">
          <Image
            src="/brand/admin-login.jpg"
            alt="Manage your properties, smarter — the Creators admin panel"
            fill
            priority
            sizes="(max-width: 1024px) 0px, 44vw"
            className="object-cover object-center"
          />

          {/* Logo over the artwork's empty top-left corner */}
          <div className="absolute top-7 left-7 z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/creators-logo.png"
              alt="Creators"
              className="w-[120px] h-auto object-contain brightness-0 invert opacity-90"
            />
          </div>
        </div>

        {/* ── Right column: the form card fills it, matching the artwork's height ── */}
        <div className="flex items-stretch justify-center px-4 py-10 sm:px-6 sm:py-12 lg:py-10 lg:px-10">
          {/* ── Inner form card ── */}
          <div
            className="
              relative w-full max-w-[560px] overflow-hidden
              flex flex-col justify-center
              lg:rounded-2xl lg:border lg:border-slate-200/80
              lg:shadow-sm lg:bg-white
              px-0 py-0 lg:px-14 lg:py-12
            "
          >
            {/* Dot-grid accent, top-right inside the card */}
            <div
              className="pointer-events-none absolute top-6 right-6 w-20 h-16 opacity-[0.22] hidden lg:block"
              style={{
                backgroundImage: "radial-gradient(#7166F0 1.4px, transparent 1.4px)",
                backgroundSize: "13px 13px",
              }}
            />

            <div className="relative z-10 w-full max-w-[400px] mx-auto">
              {/* Logo (below lg the artwork panel is hidden, so brand it here) */}
              <div className="lg:hidden mb-8 flex justify-center">
                <div className="bg-brand-purple rounded-2xl px-5 py-3.5 shadow-lg shadow-brand-purple/25">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/creators-logo.png"
                    alt="Creators"
                    className="w-[130px] h-auto object-contain brightness-0 invert"
                  />
                </div>
              </div>

              <div className="mb-7 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-purple/10 ring-1 ring-brand-purple/15 mb-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/creators-badge.png"
                    alt=""
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <h1 className="font-display text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">
                  Welcome back!
                </h1>
                <p className="text-sm text-slate-500 mt-2">
                  Sign in to your Creators admin account.
                </p>
              </div>

              <AdminLoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
