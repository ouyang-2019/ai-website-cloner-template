"use client";

import { useState } from "react";
import { X, ShieldCheck, Loader2, CheckCircle2, CreditCard, QrCode } from "lucide-react";
import type { SubscriptionPlan, BillingPeriod } from "@/types/credits";
import {
  getPlanConfig,
  getCheckoutTotal,
  getOriginalTotal,
  planDiscount,
  CURRENCY,
} from "@/lib/credits";

type Method = "alipay" | "lemonsqueezy";

interface CheckoutDrawerProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  period: BillingPeriod;
  onClose: () => void;
  onSuccess: (plan: SubscriptionPlan) => void;
}

/**
 * 支付抽屉 — LemonSqueezy（国际卡）与 支付宝（CN）占位。
 * 非功能性 mock：真实支付需接入 LemonSqueezy URL / 支付宝当面付 SDK。
 */
export function CheckoutDrawer({ open, plan, period, onClose, onSuccess }: CheckoutDrawerProps) {
  const [method, setMethod] = useState<Method>("alipay");
  const [status, setStatus] = useState<"idle" | "pending" | "done">("idle");

  if (!open || !plan) return null;
  const cfg = getPlanConfig(plan);
  // 折后应付（与定价卡口径一致）；originalTotal 为原价划线；discount 为促销折扣。
  const total = getCheckoutTotal(plan, period);
  const originalTotal = getOriginalTotal(plan, period);
  const discount = planDiscount(plan, period);
  const saved = originalTotal - total;
  const hasDiscount = !!discount && saved > 0;

  const confirm = () => {
    setStatus("pending");
    // Mock processing (no real payment gateway).
    setTimeout(() => {
      setStatus("done");
      setTimeout(() => {
        onSuccess(plan);
      }, 900);
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="glass-strong flex h-full w-full max-w-[420px] flex-col shadow-[var(--shadow-glass)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--neutral-grey200)] px-5 py-4">
          <h3 className="text-[16px] font-semibold text-[var(--brand-brand01-black)]">确认订单</h3>
          <button type="button" onClick={onClose} className="text-[var(--text-icon-text-4)] hover:text-[var(--text-icon-text-2)]" aria-label="关闭">
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Order summary */}
        <div className="border-b border-[var(--neutral-grey200)] px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--brand-brand01-black)]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cfg.accent }} />
              AUBEAU {cfg.displayName}
            </span>
            <span className="text-[12px] text-[var(--text-icon-text-4)]">{period === "yearly" ? "年付" : "月付"}</span>
          </div>
          <ul className="mt-3 space-y-1.5 text-[12px] text-[var(--text-icon-text-3)]">
            <li>· {cfg.monthlyCredits > 0 ? `${cfg.monthlyCredits.toLocaleString()} 积分 / 月` : `${cfg.weeklyCredits} 积分 / 周`}</li>
            <li>· 并发任务 {cfg.maxConcurrentTasks} · 智能体 {cfg.maxAgents === -1 ? "不限" : cfg.maxAgents}</li>
            <li>· 长期记忆 {cfg.longTermMemory ? "✓" : "—"}</li>
          </ul>
          <div className="mt-3 border-t border-[var(--neutral-grey100)] pt-3">
            <div className="flex items-baseline justify-between">
              <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-icon-text-4)]">
                应付
                {discount && (
                  <span className="rounded bg-[#FF3B5C]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#FF3B5C]">
                    {discount}折
                  </span>
                )}
              </span>
              <span className="flex items-baseline gap-1.5">
                {hasDiscount && (
                  <span className="text-[14px] font-medium tabular-nums text-[var(--text-icon-text-5)] line-through">
                    {CURRENCY}{originalTotal}
                  </span>
                )}
                <span className="text-[24px] font-bold tabular-nums text-[var(--brand-brand01-black)]">
                  {CURRENCY}{total}
                  <span className="ml-1 text-[12px] font-normal text-[var(--text-icon-text-4)]">/ {period === "yearly" ? "年" : "月"}</span>
                </span>
              </span>
            </div>
            {hasDiscount && (
              <p className="mt-1 text-right text-[11px] font-medium text-[#00a18b]">
                限时优惠 · 已省 {CURRENCY}{saved}
              </p>
            )}
          </div>
        </div>

        {/* Payment method tabs */}
        <div className="px-5 py-4">
          <div className="mb-3 inline-flex w-full items-center gap-1 rounded-lg border border-[var(--neutral-grey300)] bg-[var(--neutral-grey60)] p-1">
            <button
              type="button"
              disabled={status === "pending"}
              onClick={() => setMethod("alipay")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[13px] transition-colors ${
                method === "alipay" ? "bg-white text-[var(--brand-brand01-black)] shadow-sm" : "text-[var(--text-icon-text-4)]"
              }`}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded bg-[#1677ff] text-[9px] font-bold text-white">支</span>
              支付宝
            </button>
            <button
              type="button"
              disabled={status === "pending"}
              onClick={() => setMethod("lemonsqueezy")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[13px] transition-colors ${
                method === "lemonsqueezy" ? "bg-white text-[var(--brand-brand01-black)] shadow-sm" : "text-[var(--text-icon-text-4)]"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" strokeWidth={2} />
              LemonSqueezy
            </button>
          </div>

          {/* Method body */}
          {status === "done" ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg-soft)] py-10 text-center backdrop-blur-[12px]">
              <CheckCircle2 className="h-10 w-10 text-[#00c281]" strokeWidth={1.75} />
              <p className="mt-2 text-[14px] font-medium text-[var(--brand-brand01-black)]">支付成功</p>
              <p className="mt-1 text-[12px] text-[var(--text-icon-text-4)]">已升级到 {cfg.displayName}，积分已到账</p>
            </div>
          ) : method === "alipay" ? (
            <div className="flex flex-col items-center rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg-soft)] py-6 backdrop-blur-[12px]">
              {/* QR placeholder */}
              <div className="relative flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded-lg bg-white">
                <QrCode className="h-24 w-24 text-[var(--neutral-grey400)]" strokeWidth={1} />
                <span className="absolute bottom-2 rounded bg-white/80 px-2 py-0.5 text-[10px] text-[var(--text-icon-text-4)]">二维码占位</span>
              </div>
              <p className="mt-3 text-[13px] font-medium text-[var(--brand-brand01-black)]">使用支付宝扫码支付 {CURRENCY}{total}</p>
              <p className="mt-1 text-[11px] text-[var(--text-icon-text-4)]">扫码后请在手机上完成支付</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg-soft)] p-4 backdrop-blur-[12px]">
              <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--brand-brand01-black)]">
                <CreditCard className="h-4 w-4" strokeWidth={2} /> 信用卡 / 借记卡
              </div>
              <div className="mt-3 space-y-2">
                <div className="rounded-lg border border-[var(--neutral-grey300)] bg-white px-3 py-2 text-[12px] text-[var(--text-icon-text-4)]">
                  卡号 4242 4242 4242 4242
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-lg border border-[var(--neutral-grey300)] bg-white px-3 py-2 text-[12px] text-[var(--text-icon-text-4)]">MM / YY</div>
                  <div className="flex-1 rounded-lg border border-[var(--neutral-grey300)] bg-white px-3 py-2 text-[12px] text-[var(--text-icon-text-4)]">CVC</div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-[var(--text-icon-text-4)]">由 LemonSqueezy 安全处理 · 支持 Visa / Mastercard / Amex</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-[var(--neutral-grey200)] px-5 py-4">
          <button
            type="button"
            onClick={confirm}
            disabled={status !== "idle"}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-medium text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
            style={{ backgroundImage: "var(--gradient-brand)", boxShadow: "var(--shadow-glow-emerald)" }}
          >
            {status === "pending" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} /> 处理中…
              </>
            ) : status === "done" ? (
              "完成"
            ) : method === "alipay" ? (
              `我已完成扫码支付`
            ) : (
              `前往 LemonSqueezy 支付 ${CURRENCY}${total}`
            )}
          </button>
          <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-[var(--text-icon-text-5)]">
            <ShieldCheck className="h-3 w-3" strokeWidth={2} />
            占位演示 · 真实支付需接入 LemonSqueezy / 支付宝 SDK
          </p>
        </div>
      </div>
    </div>
  );
}
