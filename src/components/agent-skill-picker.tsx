"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Check, Search, Bot, Zap } from "lucide-react";
import { TEMPLATE_CARDS } from "@/data/content";
import { SKILLS } from "@/data/skills";
import { categoryMeta } from "@/lib/agents";

interface Props {
  open: boolean;
  initialTab: "agent" | "skill";
  mountedAgent: number | null;
  mountedSkills: string[];
  onClose: () => void;
  onAgentChange: (id: number | null) => void;
  onSkillsChange: (ids: string[]) => void;
}

/**
 * 挂载选择器 — 智能体单选（点选即挂载并关闭）+ 技能多选（toggle + 完成）。
 * 对标对话框：选中的智能体/技能像附件一样挂到输入框。
 */
export function AgentSkillPicker({
  open,
  initialTab,
  mountedAgent,
  mountedSkills,
  onClose,
  onAgentChange,
  onSkillsChange,
}: Props) {
  const [tab, setTab] = useState<"agent" | "skill">(initialTab);
  const [query, setQuery] = useState("");

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const allAgents = TEMPLATE_CARDS.map((card, i) => ({ id: i + 1, card }));
  const agents = q ? allAgents.filter((a) => a.card.title.toLowerCase().includes(q)) : allAgents;
  const skills = q ? SKILLS.filter((s) => (s.name + s.desc).toLowerCase().includes(q)) : SKILLS;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-[680px] flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs + close */}
        <div className="flex items-center justify-between border-b border-[var(--neutral-grey200)] px-4 py-3">
          <div className="inline-flex items-center gap-1 rounded-lg bg-[var(--neutral-grey60)] p-0.5">
            <button
              type="button"
              onClick={() => setTab("agent")}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[12px] transition-colors ${
                tab === "agent" ? "bg-white text-[var(--brand-brand01-black)] shadow-sm" : "text-[var(--text-icon-text-4)]"
              }`}
            >
              <Bot className="h-3.5 w-3.5" /> 智能体（单选）
            </button>
            <button
              type="button"
              onClick={() => setTab("skill")}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[12px] transition-colors ${
                tab === "skill" ? "bg-white text-[var(--brand-brand01-black)] shadow-sm" : "text-[var(--text-icon-text-4)]"
              }`}
            >
              <Zap className="h-3.5 w-3.5" /> 技能（{mountedSkills.length}）
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-icon-text-4)] hover:text-[var(--text-icon-text-2)]"
            aria-label="关闭"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-[var(--neutral-grey200)] px-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-icon-text-4)]" strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "agent" ? "搜索智能体…" : "搜索技能…"}
              className="h-8 w-full rounded-lg border border-[var(--neutral-grey300)] bg-white pl-8 pr-3 text-[12px] outline-none transition-colors focus:border-[var(--brand-brand03-blue)]"
            />
          </div>
        </div>

        {/* Grid */}
        {tab === "agent" ? (
          <div className="grid grid-cols-3 gap-2 overflow-y-auto p-3 sm:grid-cols-4">
            {agents.map(({ id, card }) => {
              const on = mountedAgent === id;
              const meta = categoryMeta(card.category);
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => {
                    onAgentChange(on ? null : id);
                    onClose();
                  }}
                  className={`relative flex flex-col overflow-hidden rounded-lg border text-left transition-all ${
                    on ? "border-2" : "border-[var(--neutral-grey200)] hover:border-[var(--neutral-grey400)]"
                  }`}
                  style={on ? { borderColor: meta.accent } : undefined}
                >
                  <div className="relative aspect-[4 / 3] w-full bg-[var(--neutral-grey100)]">
                    <Image src={card.cover} alt={card.title} fill sizes="120px" className="object-cover" />
                    {on && (
                      <span
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: meta.accent }}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <span className="line-clamp-1 px-1.5 py-1 text-[11px] font-medium text-[var(--brand-brand01-black)]">
                    {card.title}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 overflow-y-auto p-3 sm:grid-cols-4">
              {skills.map((s) => {
                const on = mountedSkills.includes(s.id);
                const meta = categoryMeta(s.category);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() =>
                      onSkillsChange(on ? mountedSkills.filter((x) => x !== s.id) : [...mountedSkills, s.id])
                    }
                    className={`relative flex flex-col overflow-hidden rounded-lg border text-left transition-all ${
                      on ? "border-2" : "border-[var(--neutral-grey200)] hover:border-[var(--neutral-grey400)]"
                    }`}
                    style={on ? { borderColor: meta.accent } : undefined}
                  >
                    <div className="relative aspect-[4 / 3] w-full bg-[var(--neutral-grey100)]">
                      <Image src={s.cover} alt={s.name} fill sizes="120px" className="object-cover" />
                      {on && (
                        <span
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: meta.accent }}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <span className="line-clamp-1 px-1.5 py-1 text-[11px] font-medium text-[var(--brand-brand01-black)]">
                      {s.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t border-[var(--neutral-grey200)] px-4 py-2.5">
              <span className="text-[11px] text-[var(--text-icon-text-4)]">已选 {mountedSkills.length} 个技能 · 可多选</span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-[var(--brand-brand01-black)] px-4 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
              >
                完成
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
