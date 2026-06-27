"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowRight, Flame, Timer } from "lucide-react";

/**
 * 限时订阅促销广告栏 —— 两款共用同一折扣信息 + 同一倒计时：
 *   年付 Ultra 73 折、Starter/Pro 88 折；月付统一 95 折。
 * 折扣口径：X 折 = 原价 X%（73 折 = 27% off）。
 *
 * - PromoBanner       ：订阅页用，强冲击力（深色渐变 + 巨型 73）+ 倒计时。
 * - HomePromoBanner   ：首页用，全宽 + 倒计时 + 立即抢购跳转 /pricing。
 */
const RULES = [
  { label: "Starter / Pro 年付", value: "88" },
  { label: "Ultra 年付", value: "73" },
  { label: "月付（所有套餐）", value: "95" },
] as const;

/* ---------------- 倒计时（滚动 3 天周期，自延续；SSR 确定性快照） ---------------- */
const DAY = 86400000;
const PERIOD = 3 * DAY;
const BASE = new Date("2026-01-01T00:00:00+08:00").getTime();
const SERVER_NOW = BASE + PERIOD - 2.5 * DAY; // SSR 确定性快照（≈2.5 天剩余）
function rollingTarget(now: number) {
  return BASE + Math.ceil((now - BASE) / PERIOD) * PERIOD;
}
function useTick(intervalMs: number) {
  return useSyncExternalStore(
    (cb) => {
      const t = setInterval(cb, intervalMs);
      return () => clearInterval(t);
    },
    () => Date.now(),
    () => SERVER_NOW,
  );
}
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** 倒计时数字块 —— 首页与订阅页共用。 */
function PromoCountdown() {
  const now = useTick(1000);
  const target = rollingTarget(now);
  const diff = Math.max(0, target - now);
  const blocks = [
    { v: pad2(Math.floor(diff / DAY)), l: "天" },
    { v: pad2(Math.floor((diff % DAY) / 3600000)), l: "时" },
    { v: pad2(Math.floor((diff % 3600000) / 60000)), l: "分" },
    { v: pad2(Math.floor((diff % 60000) / 1000)), l: "秒" },
  ];
  return (
    <div className="flex items-center gap-2">
      <Timer className="h-4 w-4 text-white/85" strokeWidth={2.5} aria-hidden />
      <span className="text-[12px] font-medium text-white/85">距结束</span>
      <div className="flex items-center gap-1">
        {blocks.map((b, i) => (
          <span key={b.l} className="flex items-center gap-1">
            <span className="flex min-w-[30px] justify-center rounded-md bg-black/30 px-1.5 py-1 text-[15px] font-black leading-none tabular-nums backdrop-blur-sm">
              {b.v}
            </span>
            <span className="text-[10px] font-medium text-white/70">{b.l}</span>
            {i < blocks.length - 1 && <span className="ml-0.5 text-white/40">:</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- 订阅页 —— 冲击力版促销栏 ---------------- */
export function PromoBanner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl text-white shadow-[0_10px_30px_-8px_rgba(255,59,92,0.5)] ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(105deg, #2A0A2E 0%, #7A0C3E 38%, #FF3B5C 70%, #FF8A1E 100%)",
      }}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(120% 120% at 12% 0%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 45%), radial-gradient(120% 120% at 100% 100%, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0) 55%)" }} />
      <span aria-hidden className="promo-shine-bar pointer-events-none absolute -inset-x-1/2 -top-1/2 h-[200%] w-1/2 rotate-12 bg-white/10 blur-2xl" />

      <div className="relative flex flex-col items-start gap-5 px-7 py-6 lg:flex-row lg:items-center lg:justify-between">
        {/* 左：徽标 + 巨型折扣 */}
        <div className="flex items-center gap-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-[0_6px_18px_rgba(0,0,0,0.25)] backdrop-blur-sm" aria-hidden>
            <Flame className="h-7 w-7" strokeWidth={2.5} />
          </span>
          <div className="leading-none">
            <span className="inline-flex items-center rounded-full bg-[#FFD93D] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#7A0C3E] shadow-sm">
              限时特惠
            </span>
            <div className="mt-2 flex items-baseline gap-2.5">
              <span className="text-[17px] font-bold text-white/90">年付狂欢 · 低至</span>
              <span className="font-black leading-[0.8] tracking-tight tabular-nums" style={{ fontSize: 76 }}>73</span>
              <span className="text-[28px] font-black leading-none">折</span>
            </div>
          </div>
        </div>

        {/* 右：倒计时 + 三档规则 */}
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <PromoCountdown />
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {RULES.map((r) => (
              <span key={r.label} className="inline-flex items-center gap-1.5 rounded-xl bg-white/16 px-3.5 py-2 backdrop-blur-sm">
                <span className="text-[12px] font-medium text-white/85">{r.label}</span>
                <span className="text-[18px] font-black leading-none tabular-nums">{r.value}</span>
                <span className="text-[10px] font-semibold text-white/75">折</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 首页 —— 全宽 + 倒计时 + 跳转按钮 ---------------- */
export function HomePromoBanner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-t-[20px] text-white ${className}`}
      style={{ backgroundImage: "linear-gradient(100deg, #2A0A2E 0%, #7A0C3E 35%, #FF3B5C 68%, #FF8A1E 100%)" }}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(120% 140% at 8% 0%, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 45%), radial-gradient(120% 120% at 100% 100%, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 55%)" }} />

      <div className="relative mx-auto flex max-w-[1320px] flex-col items-stretch gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        {/* 左：标题 + 折扣 + 规则 */}
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm" aria-hidden>
            <Flame className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#FFD93D] px-1.5 py-0.5 text-[10px] font-black tracking-wider text-[#7A0C3E]">限时</span>
              <span className="text-[15px] font-semibold text-white/90">年付狂欢 · 低至</span>
              <span className="font-black leading-none tabular-nums" style={{ fontSize: 34 }}>73</span>
              <span className="text-[16px] font-black">折</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-white/80">
              {RULES.map((r, i) => (
                <span key={r.label}>
                  {i > 0 && <span className="mr-2 text-white/40">·</span>}
                  {r.label.split(" ")[0]} <span className="font-bold tabular-nums">{r.value}</span>折
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 中：倒计时 */}
        <PromoCountdown />

        {/* 右：跳转按钮 */}
        <Link
          href="/pricing"
          className="group inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white px-5 text-[14px] font-bold text-[#7A0C3E] shadow-[0_6px_16px_rgba(0,0,0,0.22)] transition-[transform,box-shadow] hover:shadow-[0_8px_22px_rgba(0,0,0,0.28)] active:scale-[0.96]"
        >
          立即抢购
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
