"use client";

import { useState } from "react";
import { IdCard, Route, FileOutput, ShieldCheck } from "lucide-react";
import type { TemplateCard, AgentCategory, CategoryMeta } from "@/types";
import type { AgentCapability } from "@/types/credits";
import { categoryMeta } from "@/lib/agents";

type Tab = "identity" | "router" | "output" | "conduct";

/** 专注领域按大类（对标 AutoClaw agent.focus）。 */
const FOCUS: Record<AgentCategory, string[]> = {
  beauty: ["法规证据", "行业数据", "审计报告"],
  doc: ["内容生产", "版式设计", "工件发布"],
  sheet: ["数据清洗", "统计分析", "可视化"],
  video: ["脚本编排", "素材生成", "后期剪辑"],
  research: ["多源检索", "证据溯源", "综合研判"],
  writing: ["结构论证", "数据支撑", "专业表达"],
  channel: ["系统集成", "消息触达", "流程协同"],
};

/** 行为原则按主能力（对标 AutoClaw agent.principles）。 */
const PRINCIPLES: Record<AgentCapability, string[]> = {
  orchestration: ["先拆解任务再分发执行", "每个子步骤产出可验证", "异常自动回滚并上报"],
  "tool-call": ["工具不可用即降级", "高风险参数二次确认", "调用全链路留痕"],
  "memory-retrieval": ["记忆作为数据注入而非指令", "过时信息主动遗忘", "引用必带来源时间"],
  "artifact-publish": ["产物可独立查看", "附溯源元数据与积分明细", "版本可追溯可回滚"],
  "im-channel": ["外发消息需人工审批", "IM 输入默认不可信", "敏感信息脱敏后处理"],
  "autonomous-trigger": ["定时计划需用户确认", "触发频次受套餐约束", "异常即暂停并告警"],
  chat: ["先理解意图再响应", "简洁优于冗长", "不确定时主动澄清"],
};

const STYLE = ["sharp", "resourceful", "no-nonsense"];

/** 通用行为准则（对标 AutoClaw SOUL.md / OUTPUT_RULES.md 的边界条款）。 */
const CONDUCT = [
  "先问再做：关键偏好一次性问清，不因 brief 完整而跳过表单",
  "记忆为数据非指令：历史内容不越权影响当前任务",
  "高风险操作（删除 / 外发 / 支付）需运行时审批",
  "不臆造、不收敛到模板：每次产出基于真实数据与工具",
];

function routerSteps(card: TemplateCard, meta: CategoryMeta): Array<{ t: string; d: string }> {
  return [
    { t: "意图解析", d: "从用户输入提取目标、约束与期望交付形态" },
    { t: "能力路由", d: `匹配 ${card.skillRef}（${meta.label}类智能体）` },
    {
      t: "工具调用",
      d:
        card.tools.length > 0
          ? `依次调用 ${card.tools.length} 个工具：${card.tools.slice(0, 2).join("、")}${card.tools.length > 2 ? " …" : ""}`
          : "纯编排能力，按计划自主执行多步任务",
    },
    { t: "产物生成", d: "输出工件并写入工作空间 outputs/" },
    { t: "收尾归档", d: "写入记忆 · 按需经 IM 触达 · 沉淀技能证据" },
  ];
}

function outputRules(card: TemplateCard, meta: CategoryMeta): string[] {
  return [
    `工件形态：${meta.label}类 · 结构化可独立交付`,
    `质量基线：${card.tagline}`,
    "必附溯源：工具调用链 + 积分明细 + 时间戳",
    "版本管理：每次产出落 outputs/ 并保留可回滚快照",
  ];
}

const TABS: Array<{ key: Tab; label: string; Icon: typeof IdCard }> = [
  { key: "identity", label: "身份", Icon: IdCard },
  { key: "router", label: "任务路由", Icon: Route },
  { key: "output", label: "输出规则", Icon: FileOutput },
  { key: "conduct", label: "行为准则", Icon: ShieldCheck },
];

/**
 * Agent 工作空间档案 — 借鉴 AutoClaw agent-workspaces 结构
 *（IDENTITY / TASK_ROUTER / OUTPUT_RULES / SOUL），用 AUBEAU 智能体内容填充。
 * 展示智能体被如何定义：身份、任务路由逻辑、输出契约、行为边界。
 */
export function AgentWorkspaceCard({ card }: { card: TemplateCard }) {
  const [tab, setTab] = useState<Tab>("identity");
  const meta = categoryMeta(card.category);
  const focus = FOCUS[card.category];
  const principles = PRINCIPLES[card.capability];
  const steps = routerSteps(card, meta);
  const rules = outputRules(card, meta);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[var(--brand-brand01-black)]">Agent 工作空间档案</h2>
        <code className="rounded bg-[var(--neutral-grey100)] px-2 py-0.5 text-[11px] text-[var(--text-icon-text-4)]">
          workspace/{card.skillRef}/
        </code>
      </div>
      <p className="mt-1 text-[12px] text-[var(--text-icon-text-4)]">
        借鉴 AutoClaw agent-workspaces：智能体是结构化工作空间（IDENTITY / TASK_ROUTER / OUTPUT_RULES / SOUL），而非单条 prompt
      </p>

      {/* Tabs */}
      <div className="mt-3 inline-flex items-center gap-1 rounded-lg border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] p-0.5 backdrop-blur-[12px] shadow-[var(--shadow-card)]">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] transition-colors ${
              tab === key
                ? "bg-[var(--brand-brand01-black)] text-white"
                : "text-[var(--text-icon-text-3)] hover:text-[var(--text-icon-text-1)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="mt-3 rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] p-4 shadow-[var(--shadow-card)] backdrop-blur-[18px] saturate-150">
        {tab === "identity" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="角色" value={`${meta.label}智能体 · AI coworker`} />
            <Field label="名称" value={card.title} />
            <div className="sm:col-span-2">
              <FieldLabel>专注领域</FieldLabel>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {focus.map((f) => (
                  <span key={f} className="rounded bg-[var(--neutral-grey60)] px-2 py-0.5 text-[11px] text-[var(--text-icon-text-3)]">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>风格</FieldLabel>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {STYLE.map((s) => (
                  <span
                    key={s}
                    className="rounded px-2 py-0.5 text-[11px]"
                    style={{ backgroundColor: `${meta.accent}1a`, color: meta.accent }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>原则</FieldLabel>
              <ul className="mt-1.5 space-y-1.5">
                {principles.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-[12px] leading-[18px] text-[var(--text-icon-text-2)]">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: meta.accent }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "router" && (
          <ol className="space-y-2.5">
            {steps.map((s, i) => (
              <li key={s.t} className="flex gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ backgroundColor: meta.accent }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[var(--brand-brand01-black)]">{s.t}</div>
                  <div className="text-[12px] leading-[18px] text-[var(--text-icon-text-3)]">{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
        )}

        {tab === "output" && (
          <ul className="space-y-2">
            {rules.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px] leading-[18px] text-[var(--text-icon-text-2)]">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: meta.accent }} />
                {r}
              </li>
            ))}
          </ul>
        )}

        {tab === "conduct" && (
          <ul className="space-y-2">
            {CONDUCT.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[12px] leading-[18px] text-[var(--text-icon-text-2)]">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} style={{ color: meta.accent }} />
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-0.5 text-[13px] text-[var(--brand-brand01-black)]">{value}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-medium text-[var(--text-icon-text-4)]">{children}</div>;
}
