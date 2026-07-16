import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin Login | Creators",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7166F0] via-[#5a52d5] to-[#3d38a8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl px-6 py-4">
            <div className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center">
              <span className="text-white text-xl font-medium">C</span>
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-semibold tracking-widest">CREATORS</p>
              <p className="text-white/70 text-[10px] font-medium tracking-widest">ADMIN PANEL</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to your admin account</p>
          </div>
          <AdminLoginForm />
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          Creators Arena Admin — Authorized personnel only
        </p>
      </div>
    </div>
  );
}
