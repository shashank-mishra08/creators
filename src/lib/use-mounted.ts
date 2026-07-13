"use client";

import { useEffect, useState } from "react";

/** True only after first client mount — use to gate UI that depends on
 *  persisted (localStorage) state so SSR and first client render match. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
