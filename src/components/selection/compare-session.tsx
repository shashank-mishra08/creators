"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useComparison } from "@/store/comparison";

/**
 * Ends the comparison session when the visitor leaves /compare.
 *
 * The selection is persisted in localStorage, so without this it outlived the
 * comparison it was built for: after comparing, going back — or clicking Home
 * or Properties — brought the bottom tray along with it, still holding the
 * properties that had already been compared.
 *
 * Watching the pathname rather than unmounting the compare page on purpose.
 * A cleanup on unmount looks equivalent but React StrictMode mounts, unmounts
 * and remounts every effect in development, so it would wipe the selection the
 * instant the comparison opened. Comparing the previous path to the current one
 * is idempotent, so a double invocation changes nothing.
 *
 * Renders nothing; it exists for the effect.
 */
export function CompareSessionReset() {
  const pathname = usePathname();
  const previous = React.useRef(pathname);
  const clear = useComparison((s) => s.clear);

  React.useEffect(() => {
    if (previous.current === "/compare" && pathname !== "/compare") clear();
    previous.current = pathname;
  }, [pathname, clear]);

  return null;
}
