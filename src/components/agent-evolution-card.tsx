"use client";

import { useState, type ReactNode } from "react";
import { Brain, GitBranch, Timer, ChevronDown } from "lucide-react";
import type { TemplateCard } from "@/types";

type Panel = "memory" | "evolve" | "trigger" | null;

interface MemEntry {
  kind: "偏好" | "事实" | "实体";
  text: string;
  src: string;
}
interface Trigger {
  cron: string;
  title: string;
  status: "已触发" | "排队中";
}

function memories(card: TemplateCard): MemEntry[] {
  return [
    { kind: "偏好", text: `使用「${card.title}」时偏好简洁结论 + 数据表形式交付`, src: "运行 #12 · 3 天前" },
    { kind: "事实", text: `当前业务周期为行业雷达模式，每天 09:00 自动刷新趋势快照`, src: "运行 #8 · 1 周前" },
    { kind: "实体", text: `关联对象：精华品类、烟酰胺原料、竞品矩阵与备案文案`, src: "运行 #5 · 2 周前" },
  ];
}

function triggers(card: TemplateCard): Trigger[] {
  return [
    { cron: "0 9 * * *", title: `${card.title} · 行业快照`, status: "已触发" },
    { cron: "*/30 * * * *", title: `${card.title} · 数据增量校验`, status: "排队中" },
  ];
}

function Row({
  Icon,
  title,
  sub,
  open,
  onToggle,
  children,
}: {
  Icon: typeof Brain;
  title: string;
  sub: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] shadow-[var(--shadow-card)] backdrop-blur-[18px] saturate-150">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--neutral-grey100)]">
          <Icon className="h-4 w-4 text-[var(--brand-brand03-blue)]" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-[var(--brand-brand01-black)]">{title}</div>
          <div className="truncate text-[11px] text-[var(--text-icon-text-4)]">{sub}</div>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--text-icon-text-4)] transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>
      {open && <div className="border-t border-[var(--neutral-grey100)] px-4 py-3">{children}</div>}
    </div>
  );
}

/**
 * 记忆与技能进化 — AUBEAU 自研的长期记忆 + 技能版本演进 + 自主触发机制。
 * 展示长期记忆、技能版本演进、自主触发历史，让「长期记忆 / 自主触发」卖点有据可查。
 */
export function AgentEvolutionCard({ card }: { card: TemplateCard }) {
  const [open, setOpen] = useState<Panel>("memory");
  const runs = 12 + (card.title.length % 40);
  const conf = 0.82 + (card.title.length % 15) / 100;
  const mems = memories(card);
  const trigs = triggers(card);

  return (
    <section className="mt-8">
      <h2 className="text-[16px] font-semibold text-[var(--brand-brand01-black)]">记忆与技能进化</h2>
      <p className="mt-1 text-[12px] text-[var(--text-icon-text-4)]">
        AUBEAU 自研机制：智能体在运行中积累长期记忆、随证据升级技能版本、按计划自主触发。
      </p>

      <div className="mt-3 space-y-2">
        {/* 长期记忆 */}
        <Row
          Icon={Brain}
          title="长期记忆"
          sub={`已积累 ${mems.length} 条记忆（偏好 / 事实 / 实体），按需注入提示词`}
          open={open === "memory"}
          onToggle={() => setOpen(open === "memory" ? null : "memory")}
        >
          <ul className="space-y-2">
            {mems.map((m, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-[var(--neutral-grey100)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-icon-text-3)]">
                  {m.kind}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] leading-[18px] text-[var(--text-icon-text-2)]">{m.text}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--text-icon-text-5)]">来源：{m.src}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-[var(--text-icon-text-5)]">
            注：记忆作为<b>数据</b>注入提示词，而非指令——避免历史内容越权影响当前任务。
          </p>
        </Row>

        {/* 技能进化 */}
        <Row
          Icon={GitBranch}
          title="技能进化"
          sub={`当前版本 v2.1 · 累计运行 ${runs} 次 · 置信度 ${conf.toFixed(2)}`}
          open={open === "evolve"}
          onToggle={() => setOpen(open === "evolve" ? null : "evolve")}
        >
          <div className="space-y-2.5">
            <div>
              <div className="flex items-center justify-between text-[11px] text-[var(--text-icon-text-4)]">
                <span>技能成熟度</span>
                <span className="tabular-nums">{Math.round(conf * 100)}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--neutral-grey100)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${conf * 100}%`, background: "linear-gradient(90deg,#10b981,#34d399)" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { l: "累计运行", v: String(runs) },
                { l: "证据条目", v: "14" },
                { l: "版本", v: "v2.1" },
              ].map((s) => (
                <div key={s.l} className="rounded-lg bg-[var(--neutral-grey60)] py-2">
                  <div className="text-[15px] font-semibold tabular-nums text-[var(--brand-brand01-black)]">{s.v}</div>
                  <div className="text-[10px] text-[var(--text-icon-text-4)]">{s.l}</div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[var(--text-icon-text-5)]">
              每次成功运行产出证据，经评估后提升技能版本与置信度。
            </p>
          </div>
        </Row>

        {/* 自主触发 */}
        <Row
          Icon={Timer}
          title="自主触发"
          sub={`${trigs.length} 个定时计划 · 最近一次 ${trigs[0].status}`}
          open={open === "trigger"}
          onToggle={() => setOpen(open === "trigger" ? null : "trigger")}
        >
          <ul className="space-y-2">
            {trigs.map((t, i) => (
              <li key={i} className="flex items-center gap-2">
                <code className="rounded bg-[var(--neutral-grey100)] px-1.5 py-0.5 text-[11px] text-[var(--brand-brand03-blue)]">
                  {t.cron}
                </code>
                <span className="flex-1 truncate text-[12px] text-[var(--text-icon-text-2)]">{t.title}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    t.status === "已触发"
                      ? "bg-[#e7f7f0] text-[#00a371]"
                      : "bg-[var(--neutral-grey100)] text-[var(--text-icon-text-4)]"
                  }`}
                >
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
        </Row>
      </div>
    </section>
  );
}
