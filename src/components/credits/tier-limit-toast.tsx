"use client";

import { useEffect } from "react";
import { Lock, Info, X } from "lucide-react";
import { useCredits } from "./credits-provider";

/**
 * 档位限制 toast — globally controlled via context, auto-dismisses after 3s.
 * Use to nudge users when a capability/template exceeds their plan tier.
 */
export function TierLimitToast() {
  const { toast, clearToast } = useCredits();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3000);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;
  const isLimit = toast.tone === "limit";
  const Icon = isLimit ? Lock : Info;
  const accent = isLimit ? "var(--brand-brand05-magenta)" : "var(--brand-brand03-blue)";

  return (
    <div className="fixed bottom-12 left-1/2 z-[90] -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-xl bg-[var(--brand-brand01-black)] py-2.5 pl-3 pr-2.5 text-[13px] text-white shadow-[var(--shadow-card)]">
        <Icon className="h-4 w-4" strokeWidth={2} style={{ color: accent }} />
        <span>{toast.message}</span>
        <button
          type="button"
          onClick={clearToast}
          className="ml-1 text-white/60 hover:text-white"
          aria-label="关闭"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
