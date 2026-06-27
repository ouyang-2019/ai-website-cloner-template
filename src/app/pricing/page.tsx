"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import {
  PLAN_CONFIGS,
  PLANS_FOR_PRICING,
  getDisplayPrice,
  getDiscountedPrice,
  planDiscount,
  CURRENCY,
} from "@/lib/credits";
import type { SubscriptionPlan, BillingPeriod } from "@/types/credits";
import { useCredits } from "@/components/credits/credits-provider";
import { CheckoutDrawer } from "@/components/checkout-drawer";
import { PromoBanner } from "@/components/promo-banner";

const RECOMMENDED: SubscriptionPlan = "pro";

export default function PricingPage() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [checkout, setCheckout] = useState<SubscriptionPlan | null>(null);
  const { plan: currentPlan, setPlan, showToast } = useCredits();

  const handleSelect = (target: SubscriptionPlan) => {
    if (target === currentPlan) return;
    if (target === "free") {
      setPlan("free");
      showToast("已切换到 Free 套餐", "info");
      return;
    }
    // Paid plan → open checkout flow (LemonSqueezy / 支付宝 placeholder).
    setCheckout(target);
  };

  const handleCheckoutSuccess = (plan: SubscriptionPlan) => {
    setPlan(plan);
    setCheckout(null);
    showToast(`已升级到 ${PLAN_CONFIGS[plan].displayName}，积分已到账`, "info");
  };

  return (
    <div className="bg-homepage min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-[var(--glass-border-subtle)] bg-[var(--glass-bg-strong)] backdrop-blur-xl saturate-150">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[15px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)" }}
              aria-hidden
            >
              A
            </span>
            <span className="text-[18px] font-semibold tracking-tight text-[var(--brand-brand01-black)]">
              AUBEAU
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-icon-text-3)] transition-colors hover:text-[var(--brand-brand01-black)]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            返回工作台
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 py-12">
        {/* 促销广告栏 */}
        <PromoBanner className="mb-8" />

        {/* Heading + period toggle */}
        <div className="text-center">
          <h1 className="text-[32px] font-bold tracking-tight text-[var(--brand-brand01-black)]">
            选择适合你的套餐
          </h1>
          <p className="mt-2 text-[15px] text-[var(--text-icon-text-3)]">
            按智能体任务计费 · 积分永久有效 · 随时升级或降级
          </p>

          <div className="mt-6 inline-flex items-center rounded-full border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] p-1 backdrop-blur-[18px] saturate-150 shadow-[var(--shadow-card)]">
            {(["monthly", "yearly"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`relative rounded-full px-5 py-1.5 text-[13px] font-medium transition-all ${
                  period === p
                    ? "text-white shadow-[var(--shadow-glow-emerald)]"
                    : "text-[var(--text-icon-text-3)] hover:text-[var(--brand-brand01-black)]"
                }`}
                style={period === p ? { backgroundImage: "var(--gradient-brand)" } : undefined}
              >
                {p === "monthly" ? "月付" : "年付"}
                {p === "yearly" && (
                  <span className="ml-1.5 rounded bg-[var(--brand-brand04-green)]/15 px-1 text-[10px] font-semibold text-[#00a18b]">
                    低至 73 折
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tier cards */}
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PLANS_FOR_PRICING.map((planKey) => {
            const cfg = PLAN_CONFIGS[planKey];
            const isCurrent = planKey === currentPlan;
            const isRecommended = planKey === RECOMMENDED;
            const discount = planDiscount(planKey, period);
            const basePrice = getDisplayPrice(planKey, period);
            const finalPrice = getDiscountedPrice(planKey, period);
            return (
              <div
                key={planKey}
                className={`relative flex flex-col rounded-2xl border bg-[var(--glass-bg)] p-6 backdrop-blur-[18px] saturate-150 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 ${
                  isRecommended
                    ? "border-transparent ring-2 shadow-[var(--shadow-glass)]"
                    : "border-[var(--glass-border-subtle)] shadow-[var(--shadow-card)] hover:border-[var(--brand-emerald-200)] hover:shadow-[var(--shadow-glass)]"
                }`}
                style={isRecommended ? { boxShadow: `0 0 0 2px ${cfg.accent}, var(--shadow-glass)` } : undefined}
              >
                {isRecommended && (
                  <span
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[11px] font-semibold text-white"
                    style={{ backgroundColor: cfg.accent }}
                  >
                    最受欢迎
                  </span>
                )}

                {/* 折扣标签（右上角，随月付/年付切换） */}
                {discount && (
                  <span
                    className="absolute right-0 top-0 inline-flex flex-col items-center rounded-tl-none rounded-tr-2xl rounded-bl-xl rounded-br-none px-2.5 py-1 text-white shadow-[0_4px_12px_rgba(255,59,92,0.35)]"
                    style={{ backgroundImage: "linear-gradient(135deg, #FF3B5C 0%, #FF8A1E 100%)" }}
                    aria-label={`${period === "yearly" ? "年付" : "月付"} ${discount} 折`}
                  >
                    <span className="text-[9px] font-semibold uppercase leading-none tracking-wider text-white/90">
                      {period === "yearly" ? "年付" : "月付"}
                    </span>
                    <span className="flex items-baseline leading-none">
                      <span className="text-[18px] font-black tabular-nums">{discount}</span>
                      <span className="text-[10px] font-bold">折</span>
                    </span>
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cfg.accent }}
                    aria-hidden
                  />
                  <span className="text-[17px] font-semibold text-[var(--brand-brand01-black)]">
                    {cfg.displayName}
                  </span>
                </div>

                {/* Price —— 折后价（大）+ 原价划线（小） */}
                <div className="mt-3 flex items-baseline gap-1.5">
                  {basePrice > 0 ? (
                    <>
                      <span className="text-[34px] font-bold leading-none tabular-nums text-[var(--brand-brand01-black)]">
                        {CURRENCY}{finalPrice}
                      </span>
                      {discount && finalPrice < basePrice && (
                        <span className="text-[15px] font-medium leading-none text-[var(--text-icon-text-5)] line-through tabular-nums">
                          {CURRENCY}{basePrice}
                        </span>
                      )}
                      <span className="text-[13px] text-[var(--text-icon-text-4)]">
                        /{period === "yearly" ? "月·按年付" : "月"}
                      </span>
                    </>
                  ) : (
                    <span className="text-[34px] font-bold leading-none text-[var(--brand-brand01-black)]">免费</span>
                  )}
                </div>

                {/* Credits */}
                <div className="mt-2.5 text-[14px] text-[var(--text-icon-text-3)]">
                  {cfg.monthlyCredits > 0
                    ? `${cfg.monthlyCredits.toLocaleString()} 积分 / 月`
                    : `${cfg.weeklyCredits} 积分 / 周`}
                </div>

                {/* CTA */}
                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => handleSelect(planKey)}
                  className={`mt-5 w-full rounded-xl py-2.5 text-[14px] font-medium transition-opacity ${
                    isCurrent
                      ? "cursor-default bg-[var(--neutral-grey100)] text-[var(--text-icon-text-4)]"
                      : "text-white hover:opacity-90"
                  }`}
                  style={isCurrent ? undefined : { backgroundColor: cfg.accent }}
                >
                  {isCurrent ? "当前套餐" : cfg.monthlyPrice === 0 ? "开始使用" : `升级到 ${cfg.displayName}`}
                </button>

                {/* Features */}
                <ul className="mt-5 space-y-2.5">
                  {cfg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] leading-[20px] text-[var(--text-icon-text-2)]">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0"
                        strokeWidth={2.5}
                        style={{ color: cfg.accent }}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* 积分消耗参考已按需求移除 */}

      </main>

      <CheckoutDrawer
        key={checkout ? `${checkout}-${period}` : "closed"}
        open={checkout !== null}
        plan={checkout}
        period={period}
        onClose={() => setCheckout(null)}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}
