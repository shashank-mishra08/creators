"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Home, LogOut, Menu, Search } from "lucide-react";
import { replaceParams } from "@/lib/url-params";

/** The one page this box searches. */
const LIST_PATH = "/admin/properties";

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showMenu, setShowMenu] = useState(false);

  /*
   * On the properties list this box IS the list's filter, so it reads and
   * writes `?q=` — the same param the list's own box uses. It used to keep a
   * private copy of the term and push a URL on submit, which broke in two ways
   * a person would report as "the search does nothing":
   *
   *   Searching a term the URL already held pushed the identical URL. Nothing
   *   changed, so the list — which only followed `?q=` when it changed — never
   *   re-filtered. Search "eldeco", clear the list's own box, search "eldeco"
   *   again from up here: no effect, forever.
   *
   *   Arriving at `?q=eldeco` by reload, bookmark or Back left this box empty
   *   over a visibly filtered list, with nothing to clear.
   *
   * Off the list there is no `?q=` to read, so the term is held here until
   * submit carries it to the list.
   */
  const onList = pathname === LIST_PATH;
  const urlQuery = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState("");
  const query = onList ? urlQuery : draft;

  // Leaving the list, or landing on it from a link that carries a term, hands
  // the term over so the box does not jump between two values as you navigate.
  useEffect(() => setDraft(urlQuery), [urlQuery]);

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
            Submitting from another page hands the term to the properties list
            via ?q=, which is where the matching happens — one search box, one
            behaviour. On the list itself there is nowhere to go, and the typing
            has already filtered it. */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = query.trim();
            if (onList) return;
            router.push(q ? `${LIST_PATH}?q=${encodeURIComponent(q)}` : LIST_PATH);
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
            // On the list every keystroke filters, the way the list's own box
            // does; anywhere else it waits for Enter, which is what takes you
            // to the list in the first place.
            onChange={(e) =>
              onList
                ? replaceParams({ q: e.target.value.trim() ? e.target.value : null })
                : setDraft(e.target.value)
            }
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
