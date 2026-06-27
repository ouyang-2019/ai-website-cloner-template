"use client";

import { useState } from "react";
import Image from "next/image";
import { BadgeCheck, ImageIcon } from "lucide-react";
import type { TemplateCard } from "@/types";
import { agentCases } from "@/lib/agent-showcase";

/**
 * 真实案例展示 —— 首张为本智能体的真实驱动截图（运行实况），
 * 其余为同目录真实封面作为「同类产出」。点击可放大查看。
 */
export function AgentCaseShowcase({ card, id }: { card: TemplateCard; id: number }) {
  const cases = agentCases(card, id);
  const [active, setActive] = useState<number | null>(null);
  const hero = cases[0];

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-[var(--brand-brand01-black)]">真实案例</h2>
          <p className="mt-0.5 text-[12px] text-[var(--text-icon-text-4)]">
            以下为智能体真实驱动截图与同类产出，点击可放大查看
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--neutral-grey100)] px-2 py-0.5 text-[11px] text-[var(--text-icon-text-4)]">
          <ImageIcon className="h-3 w-3" strokeWidth={2} />
          {cases.length} 个案例
        </span>
      </div>

      {/* Hero —— 真实驱动截图 */}
      {hero && (
        <button
          type="button"
          onClick={() => setActive(0)}
          className="group relative mt-3 block w-full overflow-hidden rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--neutral-grey100)] text-left shadow-[var(--shadow-card)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-glass)] active:scale-[0.99]"
        >
          {/* 外环 24px → 内层图片无内边距；outline 提供 1px 纯黑描边保证图片边缘干净 */}
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={hero.img}
              alt={hero.title}
              fill
              sizes="(max-width: 768px) 100vw, 960px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              style={{ outline: "1px solid rgba(0,0,0,0.1)" }}
            />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
              <BadgeCheck className="h-3 w-3" strokeWidth={2.5} />
              真实驱动截图
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 bg-[var(--glass-bg)] px-4 py-2.5 backdrop-blur-[18px] saturate-150">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-[var(--brand-brand01-black)]">{hero.title}</p>
              <p className="truncate text-[11px] text-[var(--text-icon-text-4)]">{hero.caption}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--brand-brand01-black)] px-2.5 py-1 text-[11px] font-medium text-white">
              放大
            </span>
          </div>
        </button>
      )}

      {/* 同类产出 —— 真实封面 */}
      {cases.length > 1 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cases.slice(1).map((c, i) => (
            <button
              key={c.title}
              type="button"
              onClick={() => setActive(i + 1)}
              className="group relative block aspect-[4/3] overflow-hidden rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--neutral-grey100)] text-left shadow-[var(--shadow-card)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-glass)] active:scale-[0.98]"
            >
              <Image
                src={c.img}
                alt={c.title}
                fill
                sizes="(max-width: 640px) 50vw, 320px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                style={{ outline: "1px solid rgba(0,0,0,0.1)" }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-2.5">
                <p className="line-clamp-1 text-[12px] font-medium text-white">{c.title}</p>
                <p className="line-clamp-1 text-[10px] text-white/70">{c.caption}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 放大查看 */}
      {active !== null && cases[active] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[88vh] w-full max-w-[920px] overflow-hidden rounded-2xl shadow-2xl">
            <div className="relative aspect-[16/10] w-full bg-[var(--neutral-grey100)]">
              <Image src={cases[active].img} alt={cases[active].title} fill sizes="920px" className="object-contain" />
            </div>
            <div className="flex items-center justify-between gap-3 bg-[var(--glass-bg-strong)] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-[var(--brand-brand01-black)]">{cases[active].title}</p>
                <p className="truncate text-[11px] text-[var(--text-icon-text-4)]">{cases[active].caption}</p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="shrink-0 rounded-full bg-[var(--brand-brand01-black)] px-3 py-1 text-[11px] font-medium text-white active:scale-[0.96]"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
