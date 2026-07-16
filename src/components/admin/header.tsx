"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, Bell, ChevronDown, LogOut } from "lucide-react";

export function AdminHeader() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="h-20 bg-[#7166F0] border-b border-[#5a52d5] px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-full max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border-0 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all bg-white shadow-sm"
            placeholder="Search properties, builders, enquiries..."
          />
        </div>
      </div>

      <div className="flex items-center gap-6 pl-6">
        <button className="relative text-white/80 hover:text-white transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#7166F0]">
            3
          </span>
        </button>

        {/* User Menu */}
        <div className="relative">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setShowMenu((v) => !v)}
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-medium group-hover:bg-white/30 transition-colors">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Admin</span>
              <span className="text-[11px] text-white/70">Super Admin</span>
            </div>
            <ChevronDown className="w-4 h-4 text-white/70 group-hover:text-white transition-colors ml-1" />
          </div>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-slate-100 shadow-lg py-1 z-20">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
