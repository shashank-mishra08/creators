"use client";

import * as React from "react";
import { Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Share a link, with a visible result.
 *
 * On a phone this opens the system share sheet. On a desktop, where there is
 * no sheet, it copies the link — and says so. The previous share control copied
 * silently, which is indistinguishable from a dead button.
 *
 * `url` is taken as given rather than read from `location.href`, because a page
 * whose state lives in a store rather than the address bar would otherwise
 * share a link that shows the recipient their own data instead of the sender's.
 */
export function ShareButton({
  url,
  title,
  text,
  label = "Share",
  className,
}: {
  /** Absolute or path-relative; resolved against the current origin. */
  url: string;
  title: string;
  text?: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const share = async () => {
    const absolute = new URL(url, window.location.origin).toString();

    // `navigator.share` rejects when the user dismisses the sheet — that is a
    // choice, not a failure, so it must not fall through to copying.
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: absolute });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure origin, permissions). Falling back
      // to a prompt still lets someone copy it by hand.
      window.prompt("Copy this link", absolute);
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
        copied
          ? "border-success/40 bg-success/10 text-success"
          : "border-border text-foreground hover:bg-muted",
        className,
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? "Link copied" : label}
    </button>
  );
}
