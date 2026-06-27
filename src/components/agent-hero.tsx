"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Check, ArrowRight } from "lucide-react";
import { HOME_SKILL_SHORTCUTS } from "@/data/content";
import { SKILL_ICONS } from "@/components/icons";
import { ChatComposer, type ComposerSubmitPayload } from "@/components/chat-composer";
import { PROJECTS } from "@/data/projects";
import { DEFAULT_MODEL_ID } from "@/data/models";
import { saveComposerDraft } from "@/lib/composer-draft";
import type { ComposerAttachment } from "@/types";

/**
 * AUBEAU 首页中央问候 + 对话输入（ChatComposer）+ 主技能快捷挂载行。
 * 对话框正下方是「主技能」，点击即挂载（chip 进入输入框）；
 * 高级能力（编排/记忆/数据/工件/IM/自主触发）已移至侧栏「高级功能区」。
 */
export function AgentHero() {
  const router = useRouter();

  const [mountedAgent, setMountedAgent] = useState<number | null>(null);
  const [mountedSkills, setMountedSkills] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [model, setModel] = useState<string>(DEFAULT_MODEL_ID);
  const [target, setTarget] = useState("");

  /** 点击主技能 → 挂载/卸载到对话框（chip 显示）。 */
  const toggleSkill = (id: string) => {
    setMountedSkills((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  /** 发送：携带挂载草稿跳转项目会话（智能体选定后在项目内锁定）。 */
  const onSubmit = (payload: ComposerSubmitPayload) => {
    saveComposerDraft({
      text: payload.text,
      mountedAgent: payload.mountedAgentId,
      skills: payload.skillIds,
      attachments: payload.attachments,
      model: payload.model,
      target: payload.target,
    });
    const proj = PROJECTS.find((p) => p.status === "active") ?? PROJECTS[0];
    const q = new URLSearchParams();
    if (payload.mountedAgentId) q.set("agent", String(payload.mountedAgentId));
    if (payload.skillIds.includes("ppt")) q.set("skill", "ppt");
    const qs = q.toString();
    router.push(`/projects/${proj.id}${qs ? `?${qs}` : ""}`);
  };

  return (
    <section className="relative z-20 mx-auto flex w-[860px] max-w-full flex-col items-center gap-5 pt-[80px]">
      {/* Greeting row */}
      <div className="general-hero flex items-center gap-3">
        <button
          type="button"
          className="general-hero__config-tooltip flex cursor-pointer items-center gap-1 rounded-lg bg-[var(--background-overlay-2-tooltip)] px-2.5 py-1.5 text-[12px] leading-[18px] text-white transition-opacity hover:opacity-90"
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
          配置 AUBEAU
        </button>
        <span className="text-[18px] leading-[27px] text-[var(--neutral-grey800)]">Hi，我是 AUBEAU</span>
        <span className="text-wrap:balance text-[24px] font-medium leading-[28.8px] text-[var(--brand-brand01-black)]">
          企业级智能体协作 · 持久记忆 · 自主触发 · 一步到位
        </span>
      </div>

      {/* 对话输入器（首页即可挂载智能体/技能/附件/模型） */}
      <div className="w-full">
        <ChatComposer
          variant="hero"
          mountedAgent={mountedAgent}
          mountedSkills={mountedSkills}
          attachments={attachments}
          model={model}
          target={target}
          onAgentChange={setMountedAgent}
          onSkillsChange={setMountedSkills}
          onAttachmentsChange={setAttachments}
          onModelChange={setModel}
          onTargetChange={setTarget}
          onSubmit={onSubmit}
        />
      </div>

      {/* 主技能快捷挂载行（点击挂载到对话框）+ 全部技能入口（上方位） */}
      <div className="quick-skill-list relative flex w-full flex-col items-center gap-2.5">
        <div className="flex items-center gap-2 text-[12px] text-[var(--text-icon-text-4)]">
          <span>主技能</span>
          <span className="text-[var(--neutral-grey300)]">·</span>
          <Link
            href="/skills"
            className="inline-flex items-center gap-0.5 font-medium text-[var(--brand-brand03-blue)] transition-opacity hover:opacity-70"
          >
            全部技能 <ArrowRight className="h-3 w-3" strokeWidth={2} />
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2.5">
          {HOME_SKILL_SHORTCUTS.map((skill) => {
            const Icon = SKILL_ICONS[skill.icon];
            const on = mountedSkills.includes(skill.id);
            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggleSkill(skill.id)}
                aria-pressed={on}
                className={`quick-skill-button relative flex h-[34px] cursor-pointer items-center gap-1.5 rounded-[10px] border px-3.5 text-[13px] leading-[20px] transition-colors active:scale-[0.96] ${
                  on
                    ? "border-[var(--brand-brand03-blue)] bg-[var(--brand-brand03-blue)]/8 text-[var(--brand-brand03-blue)]"
                    : "border-[var(--neutral-grey300)] bg-white text-[var(--text-icon-text-2)] hover:border-[var(--neutral-grey400)] hover:bg-[var(--neutral-grey60)]"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {skill.label}
                {on && <Check className="h-3 w-3" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
