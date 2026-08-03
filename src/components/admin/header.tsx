"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Home, LogOut, Menu, Search } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  AGENT: "Agent",
};

export function AdminHeader({
  user,
  onMenuClick,
}: {
  user?: { name: string; role: string };
  onMenuClick?: () => void;
}) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [query, setQuery] = useState("");

  const displayName = user?.name || "Admin";
  const displayRole = (user && ROLE_LABEL[user.role]) || "Super Admin";
  const initial = displayName.trim().charAt(0).toUpperCase() || "A";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="h-16 sm:h-20 bg-[#7166F0] border-b border-[#5a52d5] px-3 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-10">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="shrink-0 rounded-lg p-2 text-white/90 transition-colors hover:bg-white/15 hover:text-white lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Full search from sm up; below that it would crowd out everything else.
            Submitting hands the term to the properties list via ?q=, which is
            where the matching actually happens — one search box, one behaviour. */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = query.trim();
            router.push(q ? `/admin/properties?q=${encodeURIComponent(q)}` : "/admin/properties");
          }}
          role="search"
          className="relative hidden w-full max-w-xl sm:block"
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search properties"
            className="block w-full pl-10 pr-3 py-2.5 border-0 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all bg-white shadow-sm"
            placeholder="Search properties by name, builder or locality…"
          />
        </form>
      </div>

      <div className="flex items-center gap-3 sm:gap-6 sm:pl-6">
        {/* User Menu */}
        <div className="relative">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setShowMenu((v) => !v)}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 bg-white/20 rounded-full flex items-center justify-center text-white font-medium group-hover:bg-white/30 transition-colors">
              {initial}
            </div>
            {/* Name/role would overflow a phone header — the avatar carries it there. */}
            <div className="hidden md:flex flex-col min-w-0">
              <span className="truncate text-sm font-semibold text-white">{displayName}</span>
              <span className="truncate text-[11px] text-white/70">{displayRole}</span>
            </div>
            <ChevronDown className="hidden md:block w-4 h-4 text-white/70 group-hover:text-white transition-colors ml-1" />
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
              {/* The way back to the public site. The session is shared, so this
                  leaves the admin signed in — it navigates, it does not sign out.
                  Until now the panel was a dead end unless you edited the URL. */}
              <Link
                href="/"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-2.5 w-full border-t border-slate-100 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                Back to website
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
