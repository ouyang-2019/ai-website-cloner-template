"use client";

import Link from "next/link";
import { Zap, Gift } from "lucide-react";
import { useCredits } from "./credits-provider";
import { getPlanConfig } from "@/lib/credits";

/**
 * 积分余额卡 — current balance, plan, monthly cap, and a progress bar.
 * Shown inside the header credit popover.
 */
export function CreditBalance() {
  const { balance, plan, dailyClaimed, weeklyClaimed, claimWeekly } = useCredits();
  const cfg = getPlanConfig(plan);
  const cap = cfg.monthlyCredits || cfg.weeklyCredits * 4;
  const pct = cap > 0 ? Math.min(100, Math.round((balance / cap) * 100)) : 0;
  const isFree = plan === "free";
  const claimed = weeklyClaimed ?? dailyClaimed;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-icon-text-2)]">
          <Zap className="h-3.5 w-3.5" strokeWidth={2} style={{ color: cfg.accent }} />
          积分余额
        </div>
        <span
          className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white"
          style={{ backgroundColor: cfg.accent }}
        >
          {cfg.displayName}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-[28px] font-bold leading-none text-[var(--brand-brand01-black)]">
          {balance.toLocaleString()}
        </span>
        <span className="text-[13px] text-[var(--text-icon-text-4)]">
          / {cap.toLocaleString()} {isFree ? "(周额度×4)" : "积分"}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--neutral-grey200)]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: cfg.accent }}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        {isFree && (
          <button
            type="button"
            onClick={claimWeekly}
            disabled={claimed}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--neutral-grey300)] bg-white px-3 py-2 text-[13px] font-medium text-[var(--text-icon-text-2)] transition-colors hover:bg-[var(--neutral-grey60)] disabled:opacity-50"
          >
            <Gift className="h-4 w-4" strokeWidth={2} />
            {claimed ? "本周已领取" : "领取每周积分"}
          </button>
        )}
        <Link
          href="/pricing"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: cfg.accent }}
        >
          升级套餐
        </Link>
      </div>
    </div>
  );
}
