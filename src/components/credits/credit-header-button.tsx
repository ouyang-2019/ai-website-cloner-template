"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useCredits } from "./credits-provider";
import { getPlanConfig } from "@/lib/credits";
import { CreditBalance } from "./credit-balance";
import { CreditUsageHistory } from "./credit-usage-history";

/**
 * 顶栏积分胶囊 — shows balance + plan accent; click opens a popover with
 * balance card + usage history + upgrade entry.
 */
export function CreditHeaderButton() {
  const { balance, plan } = useCredits();
  const [open, setOpen] = useState(false);
  const cfg = getPlanConfig(plan);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--neutral-grey300)] bg-white px-3 text-[13px] font-medium text-[var(--text-icon-text-1)] transition-colors hover:bg-[var(--neutral-grey60)]"
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: cfg.accent }}
          aria-hidden
        />
        <span className="tabular-nums">{balance.toLocaleString()}</span>
        <span className="text-[var(--text-icon-text-4)]">积分</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--text-icon-text-4)] transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[320px] overflow-hidden rounded-2xl border border-[var(--neutral-grey200)] bg-white shadow-[var(--shadow-card)]">
          <CreditBalance />
          <CreditUsageHistory limit={8} />
        </div>
      )}
    </div>
  );
}
