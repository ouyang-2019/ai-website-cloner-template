"use client";

import Link from "next/link";
import { Coins, X } from "lucide-react";
import { useCredits } from "./credits-provider";

/**
 * 积分不足弹窗 — globally controlled via context. Prompts the user to
 * upgrade or purchase credits when a task exceeds their balance.
 */
export function CreditInsufficientDialog() {
  const { insufficient, clearInsufficient, balance } = useCredits();

  if (!insufficient) return null;
  const { cost, feature } = insufficient;
  const shortfall = Math.max(0, cost - balance);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={clearInsufficient}
    >
      <div
        className="w-full max-w-[380px] rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--beta-bg)]">
            <Coins className="h-5 w-5 text-[var(--beta-text)]" strokeWidth={2} />
          </div>
          <button
            type="button"
            onClick={clearInsufficient}
            className="text-[var(--text-icon-text-4)] hover:text-[var(--text-icon-text-2)]"
            aria-label="关闭"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <h3 className="mt-3 text-[17px] font-semibold text-[var(--brand-brand01-black)]">
          积分不足
        </h3>
        <p className="mt-1 text-[13px] leading-[20px] text-[var(--text-icon-text-3)]">
          「{feature}」需要 <b className="text-[var(--text-icon-text-1)]">{cost}</b> 积分，
          当前余额 <b className="text-[var(--text-icon-text-1)]">{balance.toLocaleString()}</b>，
          还差 <b className="text-[var(--brand-brand05-magenta)]">{shortfall.toLocaleString()}</b> 积分。
        </p>

        <div className="mt-4 flex gap-2">
          <Link
            href="/pricing"
            onClick={clearInsufficient}
            className="flex flex-1 items-center justify-center rounded-xl bg-[var(--brand-brand01-black)] py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
          >
            升级套餐
          </Link>
          <button
            type="button"
            onClick={clearInsufficient}
            className="flex-1 rounded-xl border border-[var(--neutral-grey300)] bg-white py-2.5 text-[14px] font-medium text-[var(--text-icon-text-2)] transition-colors hover:bg-[var(--neutral-grey60)]"
          >
            稍后再说
          </button>
        </div>
      </div>
    </div>
  );
}
