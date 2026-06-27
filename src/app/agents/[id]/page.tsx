"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Play, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AgentEngagementBar } from "@/components/agent-engagement-bar";
import { AgentCaseShowcase } from "@/components/agent-case-showcase";
import { BeautyBarrierPanel } from "@/components/beauty-barrier-panel";
import { AgentTierBadge } from "@/components/credits/agent-tier-badge";
import { useCredits } from "@/components/credits/credits-provider";
import { PLAN_ORDER, getPlanConfig } from "@/lib/credits";
import { getAgentById, agentDescription, relatedAgents, categoryMeta } from "@/lib/agents";
import { agentHowItWorks, agentCopyConfig } from "@/lib/agent-showcase";
import { PROJECTS } from "@/data/projects";

/**
 * 案例智能体介绍页 —— 纯净展示页（参考 loomic 模板展示风格）。
 * 刻意剥离「积分/费用」语义：不展示能力积分表、运行积分与积分 CTA，
 * 只保留展示与启动：封面、简介、真实案例、工作原理、互动与做同款。
 */
export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = use(params);
  const id = Number(idStr);
  const router = useRouter();
  const { showToast, plan } = useCredits();

  const card = getAgentById(id);

  if (!card) {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-auto">
          <p className="text-[15px] text-[var(--text-icon-text-3)]">未找到该智能体</p>
          <Link href="/explore" className="text-[13px] text-[var(--brand-brand03-blue)] hover:underline">
            返回探索
          </Link>
        </div>
      </AppShell>
    );
  }

  const meta = categoryMeta(card.category);
  const locked = card.minTier ? PLAN_ORDER.indexOf(plan) < PLAN_ORDER.indexOf(card.minTier) : false;
  const steps = agentHowItWorks(card.capability);
  const related = relatedAgents(id, 4);

  /** 做同款 —— 选定即锁定该智能体并进入项目工作台（不展示积分）。 */
  const onUseTemplate = () => {
    if (locked && card.minTier) {
      showToast(`需要 ${getPlanConfig(card.minTier).displayName} 套餐才能使用该模板`, "limit");
      return;
    }
    showToast(`已启动「${card.title}」模板`, "info");
    const proj = PROJECTS.find((p) => p.agentId === id) ?? PROJECTS.find((p) => p.status === "active") ?? PROJECTS[0];
    router.push(`/projects/${proj.id}?agent=${id}`);
  };

  /** 一键复制智能体配置（真实 skillRef / 工具链）。 */
  const onCopyConfig = async () => {
    try {
      await navigator.clipboard?.writeText(agentCopyConfig(card, meta));
      showToast("已复制智能体配置", "info");
    } catch {
      showToast("复制失败，请手动选取", "info");
    }
  };

  return (
    <AppShell>
      <div className="scrollbar-hide bg-homepage flex-1 overflow-auto">
        <div className="mx-auto max-w-[1080px] px-6 py-6">
          {/* 顶栏：返回 / 互动条 */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/explore"
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-[13px] text-[var(--text-icon-text-4)] transition-colors hover:bg-[var(--neutral-grey60)] hover:text-[var(--text-icon-text-2)]"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              返回探索
            </Link>
            <AgentEngagementBar agentId={id} title={card.title} />
          </div>

          {/* Header：封面 + 元信息 */}
          <div className="mt-4 grid gap-6 md:grid-cols-[320px_1fr]">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--neutral-grey100)] shadow-[var(--shadow-card)]">
              <Image src={card.cover} alt={card.title} fill sizes="320px" className="object-cover" style={{ outline: "1px solid rgba(0,0,0,0.1)" }} />
              {card.minTier && (
                <div className="absolute left-3 top-3">
                  <AgentTierBadge plan={card.minTier} />
                </div>
              )}
              <span
                className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm"
                style={{ backgroundColor: `${meta.accent}e6` }}
              >
                <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                {meta.label}
              </span>
            </div>

            <div className="flex flex-col">
              <h1 className="text-balance text-[28px] font-bold leading-tight text-[var(--brand-brand01-black)]">
                {card.title}
              </h1>
              <p className="mt-2 text-[15px] font-medium text-[var(--text-icon-text-2)]">{card.tagline}</p>
              <p className="mt-3 text-[14px] leading-[24px] text-[var(--text-icon-text-3)]">
                {agentDescription(card)}
              </p>

              {/* 工具链（真实工具标识，体现可溯源） */}
              {card.tools.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {card.tools.slice(0, 6).map((t) => (
                    <code
                      key={t}
                      className="rounded-md bg-[var(--neutral-grey60)] px-2 py-0.5 text-[11px] text-[var(--text-icon-text-3)]"
                    >
                      {t}
                    </code>
                  ))}
                  {card.tools.length > 6 && (
                    <span className="rounded-md px-2 py-0.5 text-[11px] text-[var(--text-icon-text-5)]">
                      +{card.tools.length - 6}
                    </span>
                  )}
                </div>
              )}

              {/* CTA：做同款 / 复制配置（无积分语义） */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onUseTemplate}
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl px-6 text-[14px] font-medium text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.96]"
                  style={{ backgroundImage: "var(--gradient-brand)", boxShadow: "var(--shadow-glow-emerald)" }}
                >
                  <Play className="h-4 w-4" strokeWidth={2.5} />
                  {locked ? `解锁并做同款 · ${getPlanConfig(card.minTier!).displayName}` : "使用模板 · 做同款"}
                </button>
                <button
                  type="button"
                  onClick={onCopyConfig}
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] px-5 text-[14px] font-medium text-[var(--text-icon-text-2)] shadow-[var(--shadow-card)] backdrop-blur-[18px] saturate-150 transition-[transform,background-color] hover:bg-[var(--neutral-grey60)] active:scale-[0.96]"
                >
                  <Copy className="h-4 w-4" strokeWidth={2} />
                  复制配置
                </button>
              </div>
            </div>
          </div>

          {/* 真实案例 */}
          <AgentCaseShowcase card={card} id={id} />

          <BeautyBarrierPanel card={card} />

          {/* 工作原理 —— 3 步执行链路 */}
          <section className="mt-10">
            <h2 className="text-[16px] font-semibold text-[var(--brand-brand01-black)]">工作原理</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {steps.map((s, i) => (
                <div
                  key={s}
                  className="relative overflow-hidden rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] p-4 shadow-[var(--shadow-card)] backdrop-blur-[18px] saturate-150"
                >
                  <span
                    className="absolute -right-3 -top-3 text-[44px] font-black leading-none opacity-[0.08]"
                    style={{ color: meta.accent }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                    style={{ backgroundColor: meta.accent }}
                  >
                    {i + 1}
                  </span>
                  <p className="mt-2.5 text-[13px] font-medium leading-[20px] text-[var(--text-icon-text-2)]">{s}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 相关智能体 */}
          <section className="mt-10 pb-12">
            <h2 className="text-[16px] font-semibold text-[var(--brand-brand01-black)]">相关智能体</h2>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {related.map(({ id: rid, card: rc }) => (
                <Link
                  key={rid}
                  href={`/agents/${rid}`}
                  className="group relative block aspect-[3/4] overflow-hidden rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--neutral-grey100)] shadow-[var(--shadow-card)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-glass)] active:scale-[0.98]"
                >
                  <Image src={rc.cover} alt={rc.title} fill sizes="220px" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" style={{ outline: "1px solid rgba(0,0,0,0.1)" }} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2.5">
                    <p className="line-clamp-1 text-[12px] font-medium text-white">{rc.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
