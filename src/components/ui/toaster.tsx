"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info } from "lucide-react";
import { useComparison } from "@/store/comparison";

/** Lightweight toast bridge for the comparison store (e.g. max-selection nudge). */
export function Toaster() {
  const toast = useComparison((s) => s.toast);
  const setToast = useComparison((s) => s.setToast);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast, setToast]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="pointer-events-auto flex items-center gap-2.5 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lift"
          >
            <Info className="h-4 w-4 text-accent" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
