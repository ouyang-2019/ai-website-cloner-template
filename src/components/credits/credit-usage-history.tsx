"use client";

import { useCredits } from "./credits-provider";
import type { CreditTransactionType } from "@/types/credits";

const TYPE_LABELS: Record<CreditTransactionType, string> = {
  subscription_grant: "套餐发放",
  weekly_grant: "每周领取",
  daily_grant: "每日领取",
  purchase: "积分购买",
  task_deduct: "任务消耗",
  task_refund: "退还",
  admin_adjustment: "调整",
  bonus: "赠送",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.round(hours / 24);
  return `${days} 天前`;
}

/**
 * 积分明细 — scrollable transaction list with +/- amounts and relative time.
 */
export function CreditUsageHistory({ limit }: { limit?: number }) {
  const { transactions } = useCredits();
  const list = limit ? transactions.slice(0, limit) : transactions;

  return (
    <div className="border-t border-[var(--neutral-grey200)]">
      <div className="px-4 pb-1 pt-3 text-[12px] font-medium text-[var(--text-icon-text-4)]">
        使用明细
      </div>
      <div className="max-h-[280px] overflow-y-auto px-2 pb-2">
        {list.map((t) => {
          const positive = t.amount >= 0;
          return (
            <div
              key={t.id}
              className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-[var(--neutral-grey60)]"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] text-[var(--text-icon-text-1)]">
                  {t.description ?? TYPE_LABELS[t.transactionType]}
                </div>
                <div className="text-[11px] text-[var(--text-icon-text-5)]">
                  {TYPE_LABELS[t.transactionType]} · {formatTime(t.createdAt)}
                </div>
              </div>
              <div
                className={`shrink-0 text-[13px] font-semibold tabular-nums ${
                  positive ? "text-[#00b377]" : "text-[var(--text-icon-text-2)]"
                }`}
              >
                {positive ? "+" : ""}
                {t.amount}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
