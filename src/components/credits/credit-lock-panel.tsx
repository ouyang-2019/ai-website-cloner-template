"use client";

import Link from "next/link";
import { ArrowUpRight, Coins, CreditCard, Lock } from "lucide-react";
import type { CreditEstimate } from "@/types/credits";

function formatCredits(value: number | undefined): string {
  return Math.max(0, Math.round(value ?? 0)).toLocaleString();
}

export function CreditLockPanel({
  estimate,
  feature,
  className = "",
}: {
  estimate: CreditEstimate;
  feature: string;
  className?: string;
}) {
  const shortfall = estimate.shortfall > 0 ? estimate.shortfall : estimate.topupNeeded;
  const rechargeHref = estimate.rechargeUrl || "/pricing?intent=recharge";
  const upgradeHref = estimate.upgradeUrl || "/pricing?intent=upgrade";

  return (
    <div className={`flex h-full min-h-[360px] items-center justify-center px-5 py-8 ${className}`}>
      <section className="w-full max-w-[560px] rounded-lg border border-[var(--glass-border-subtle)] bg-white/90 p-6 shadow-[var(--shadow-card)] backdrop-blur-[18px]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--beta-bg)] text-[var(--beta-text)]">
            <Lock className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[18px] font-semibold text-[var(--brand-brand01-black)]">
              积分不足，已暂停本次任务
            </h2>
            <p className="mt-1 text-[13px] text-[var(--text-icon-text-4)]">
              {feature} 需要先补足预算，页面已锁定为积分处理视图。
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--neutral-grey200)] bg-[var(--neutral-grey60)] px-3 py-3">
            <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-icon-text-4)]">
              <Coins className="h-3.5 w-3.5" strokeWidth={2} />
              当前余额
            </div>
            <div className="mt-1 text-[20px] font-semibold tabular-nums text-[var(--brand-brand01-black)]">
              {formatCredits(estimate.available)}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--neutral-grey200)] bg-[var(--neutral-grey60)] px-3 py-3">
            <div className="text-[12px] text-[var(--text-icon-text-4)]">预估上限</div>
            <div className="mt-1 text-[20px] font-semibold tabular-nums text-[var(--brand-brand01-black)]">
              {formatCredits(estimate.high)}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--neutral-grey200)] bg-[var(--neutral-grey60)] px-3 py-3">
            <div className="text-[12px] text-[var(--text-icon-text-4)]">仍需补足</div>
            <div className="mt-1 text-[20px] font-semibold tabular-nums text-[var(--brand-brand05-magenta)]">
              {formatCredits(shortfall)}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-[var(--neutral-grey60)] px-3 py-2 text-[12px] leading-[20px] text-[var(--text-icon-text-3)]">
          预估区间：{formatCredits(estimate.low)} - {formatCredits(estimate.high)} 积分。
          {estimate.reachableRounds > 0 ? ` 当前余额最多可覆盖 ${estimate.reachableRounds} 轮。` : " 当前余额不足以开启首轮预算。"}
          {estimate.note ? ` ${estimate.note}` : ""}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            href={rechargeHref}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--brand-brand01-black)] px-4 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
          >
            <CreditCard className="h-4 w-4" strokeWidth={2} />
            充值积分
          </Link>
          <Link
            href={upgradeHref}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--neutral-grey300)] bg-white px-4 text-[14px] font-medium text-[var(--text-icon-text-2)] transition-colors hover:bg-[var(--neutral-grey60)]"
          >
            升级订阅
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </div>
  );
}
