"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  Target,
  Wand2,
  Zap,
  Paperclip,
  ChevronDown,
  Check,
  X,
  ArrowUp,
  Link2,
  FileText,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { AgentSkillPicker } from "@/components/agent-skill-picker";
import { TEMPLATE_CARDS } from "@/data/content";
import { SKILLS } from "@/data/skills";
import { MODELS, DEFAULT_MODEL_ID, modelLabel } from "@/data/models";
import { categoryMeta } from "@/lib/agents";
import type { ComposerAttachment } from "@/types";

/** 提交时上抛的完整载荷（发送消息 / 建项目跳转共用）。 */
export interface ComposerSubmitPayload {
  text: string;
  mountedAgentId: number | null;
  skillIds: string[];
  attachments: ComposerAttachment[];
  model: string;
  target?: string;
}

export interface ChatComposerProps {
  /** 已挂载智能体（1-based id 或 null）。 */
  mountedAgent: number | null;
  mountedSkills: string[];
  attachments: ComposerAttachment[];
  /** 选中模型 id。 */
  model: string;
  /** "目标" 输入值（可选）。 */
  target?: string;
  /** 初始文本（跨页携带的草稿，仅在挂载时回填一次）。 */
  initialText?: string;
  /**
   * 智能体锁定：为 true 时智能体 chip 只读（不可移除、显示锁标）。
   * 用于项目会话——进入即绑定项目智能体，选定后不能改。
   */
  agentLocked?: boolean;
  /** 隐藏"目标"按钮（首页 Hero 不需要时可关闭）。 */
  hideTarget?: boolean;
  /** 顶部插槽（如 PPT 配置面板）。 */
  topSlot?: ReactNode;
  /** 受控回调。 */
  onAgentChange: (id: number | null) => void;
  onSkillsChange: (ids: string[]) => void;
  onAttachmentsChange: (a: ComposerAttachment[]) => void;
  onModelChange: (m: string) => void;
  onTargetChange?: (t: string) => void;
  onSubmit: (payload: ComposerSubmitPayload) => void;
  /** 发送中（禁用按钮 + loading）。 */
  sending?: boolean;
  /** 右下角积分提示文案。 */
  costLabel?: string;
  /** 输入框占位符。 */
  placeholder?: string;
  /** 视觉密度：hero（首页大输入）/ panel（会话页紧凑）。 */
  variant?: "hero" | "panel";
}

function IconButton({
  icon: Icon,
  label,
  active,
  badge,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  badge?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`inline-flex h-8 min-w-[40px] items-center gap-1.5 rounded-lg px-2.5 text-[12px] transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96] disabled:opacity-40 ${
        active
          ? "text-[var(--brand-brand03-blue)]"
          : "text-[var(--neutral-grey800)] hover:bg-[var(--fill-3-hover)]"
      }`}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      <span className="whitespace-nowrap">{label}</span>
      {badge && <span className="tabular-nums text-[11px]">{badge}</span>}
    </button>
  );
}

/** 自定义下拉（模型选择 / 附件菜单）— 无依赖，点击外部关闭。 */
function Dropdown({
  open,
  onClose,
  children,
  align = "left",
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} aria-hidden />
      <div
        className={`absolute bottom-full z-[70] mb-2 ${
          align === "right" ? "right-0" : "left-0"
        } ${className}`}
      >
        {children}
      </div>
    </>
  );
}

/**
 * 共享对话输入器 — 首页 Hero 与项目会话页共用。
 * 工具栏：目标 / 智能体 / 技能 / 附件 / 模型 / 发送。
 * 锁定规则：agentLocked 时智能体 chip 只读；技能始终可调。
 */
export function ChatComposer({
  mountedAgent,
  mountedSkills,
  attachments,
  model,
  target = "",
  initialText,
  agentLocked = false,
  hideTarget = false,
  topSlot,
  onAgentChange,
  onSkillsChange,
  onAttachmentsChange,
  onModelChange,
  onTargetChange,
  onSubmit,
  sending = false,
  costLabel,
  placeholder,
  variant = "panel",
}: ChatComposerProps) {
  const [text, setText] = useState(initialText ?? "");
  const [picker, setPicker] = useState<{ open: boolean; tab: "agent" | "skill" }>({
    open: false,
    tab: "agent",
  });
  const [menu, setMenu] = useState<null | "model" | "attach">(null);
  const [targetOpen, setTargetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 智能体锁定时不允许打开选择器替换（选定即锁定）。
  const agentEditable = !agentLocked;

  const agentCard = mountedAgent !== null ? TEMPLATE_CARDS[mountedAgent - 1] : null;
  const isHero = variant === "hero";

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next: ComposerAttachment[] = Array.from(files).map((f) => ({
      id: `att-${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      kind: "file" as const,
      size: f.size,
    }));
    onAttachmentsChange([...attachments, ...next]);
  };

  const addLink = () => {
    const url = window.prompt("粘贴文件或网页链接");
    if (!url) return;
    const name = url.split("/").filter(Boolean).pop() || url;
    onAttachmentsChange([
      ...attachments,
      { id: `att-link-${Math.random().toString(36).slice(2, 7)}`, name, kind: "link", url },
    ]);
  };

  const removeAttachment = (id: string) =>
    onAttachmentsChange(attachments.filter((a) => a.id !== id));

  const submit = () => {
    const value = text.trim();
    if (!value || sending) return;
    onSubmit({
      text: value,
      mountedAgentId: mountedAgent,
      skillIds: mountedSkills,
      attachments,
      model,
      target: target || undefined,
    });
    setText("");
  };

  const hasMounts = agentCard !== null || mountedSkills.length > 0 || attachments.length > 0;

  return (
    <div
      className={`relative flex w-full flex-col gap-3 p-4 ${
        isHero
          ? "rounded-[24px] border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] shadow-[var(--shadow-glass)] backdrop-blur-[18px] saturate-150"
          : "rounded-[20px] border border-[var(--neutral-grey200)] bg-white shadow-[var(--shadow-input)]"
      }`}
    >
      {/* 顶部插槽（PPT 配置等） */}
      {topSlot}

      {/* 已挂载：智能体 / 技能 / 附件 */}
      {hasMounts && (
        <div className="flex flex-wrap gap-1.5">
          {agentCard && (
            <span
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-white"
              style={{ backgroundColor: categoryMeta(agentCard.category).accent }}
            >
              {agentLocked ? (
                <Lock className="h-3 w-3" strokeWidth={2.5} />
              ) : (
                <Wand2 className="h-3 w-3" strokeWidth={2.5} />
              )}
              <span className="max-w-[140px] truncate">{agentCard.title}</span>
              {!agentLocked && (
                <button
                  type="button"
                  onClick={() => onAgentChange(null)}
                  className="ml-0.5 rounded-full hover:bg-white/25"
                  aria-label="移除智能体"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              )}
            </span>
          )}
          {mountedSkills.map((sid) => {
            const s = SKILLS.find((x) => x.id === sid);
            if (!s) return null;
            const meta = categoryMeta(s.category);
            return (
              <span
                key={sid}
                className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium"
                style={{ borderColor: meta.accent, color: meta.accent }}
              >
                <Zap className="h-3 w-3" strokeWidth={2.5} />
                <span className="max-w-[120px] truncate">{s.name}</span>
                <button
                  type="button"
                  onClick={() => onSkillsChange(mountedSkills.filter((x) => x !== sid))}
                  className="ml-0.5 rounded-full hover:bg-[var(--neutral-grey100)]"
                  aria-label={`移除 ${s.name}`}
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </span>
            );
          })}
          {attachments.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--neutral-grey300)] bg-[var(--neutral-grey60)] px-2 py-1 text-[11px] font-medium text-[var(--text-icon-text-2)]"
            >
              {a.kind === "link" ? (
                <Link2 className="h-3 w-3" strokeWidth={2.5} />
              ) : (
                <FileText className="h-3 w-3" strokeWidth={2.5} />
              )}
              <span className="max-w-[160px] truncate">{a.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(a.id)}
                className="ml-0.5 rounded-full hover:bg-[var(--neutral-grey100)]"
                aria-label={`移除 ${a.name}`}
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 目标输入（展开态） */}
      {targetOpen && !hideTarget && (
        <div className="flex items-center gap-2 rounded-lg bg-[var(--neutral-grey60)] px-2.5 py-1.5">
          <Target className="h-[18px] w-[18px] text-[var(--brand-brand03-blue)]" strokeWidth={1.75} />
          <input
            autoFocus
            value={target}
            onChange={(e) => onTargetChange?.(e.target.value)}
            placeholder="本次任务的目标 / 期望产出（可选）"
            className="h-7 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--text-icon-text-5)]"
          />
          <button
            type="button"
            onClick={() => setTargetOpen(false)}
            className="text-[var(--text-icon-text-4)] hover:text-[var(--text-icon-text-2)]"
            aria-label="收起目标"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      )}

      {/* 输入区 */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onInput={(e) => setText(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={isHero ? 2 : 1}
        placeholder={
          placeholder ??
          (agentCard
            ? `对「${agentCard.title}」说点什么…`
            : "试试安排智能体任务、自主流程或定时触发，输入@可引用智能体或记忆")
        }
        className="w-full resize-none bg-transparent text-[15px] leading-[24px] text-[var(--text-icon-text-1)] outline-none placeholder:text-[var(--text-icon-text-5)]"
      />

      {/* 工具栏 */}
      <div className="flex items-center gap-1.5">
        {!hideTarget && (
          <IconButton
            icon={Target}
            label="目标"
            active={targetOpen || !!target}
            onClick={() => setTargetOpen((v) => !v)}
          />
        )}
        <IconButton
          icon={Wand2}
          label="智能体"
          active={mountedAgent !== null}
          disabled={!agentEditable && mountedAgent !== null}
          badge={mountedAgent !== null ? "✓" : undefined}
          onClick={() => setPicker({ open: true, tab: "agent" })}
        />
        <IconButton
          icon={Zap}
          label="技能"
          active={mountedSkills.length > 0}
          badge={mountedSkills.length > 0 ? `(${mountedSkills.length})` : undefined}
          onClick={() => setPicker({ open: true, tab: "skill" })}
        />

        {/* 附件 */}
        <div className="relative">
          <IconButton
            icon={Paperclip}
            label="附件"
            active={attachments.length > 0}
            badge={attachments.length > 0 ? `(${attachments.length})` : undefined}
            onClick={() => setMenu(menu === "attach" ? null : "attach")}
          />
          <Dropdown open={menu === "attach"} onClose={() => setMenu(null)} align="left">
            <div className="w-44 max-h-[60vh] overflow-y-auto rounded-xl border border-[var(--neutral-grey200)] bg-white py-1 shadow-[var(--shadow-card)]">
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--text-icon-text-2)] hover:bg-[var(--neutral-grey60)]"
              >
                <FileText className="h-4 w-4" strokeWidth={1.75} /> 上传文件
              </button>
              <button
                type="button"
                onClick={() => {
                  addLink();
                  setMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--text-icon-text-2)] hover:bg-[var(--neutral-grey60)]"
              >
                <Link2 className="h-4 w-4" strokeWidth={1.75} /> 添加链接
              </button>
            </div>
          </Dropdown>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {/* 模型 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenu(menu === "model" ? null : "model")}
            className={`inline-flex h-8 min-w-[40px] items-center gap-1 rounded-lg px-2.5 text-[12px] transition-colors ${
              model && model !== DEFAULT_MODEL_ID
                ? "text-[var(--brand-brand03-blue)]"
                : "text-[var(--neutral-grey800)] hover:bg-[var(--fill-3-hover)]"
            }`}
          >
            <span className="whitespace-nowrap">{modelLabel(model)}</span>
            {model === DEFAULT_MODEL_ID && (
              <span className="rounded bg-[var(--beta-bg)] px-1 text-[9px] leading-tight text-[var(--beta-text)]">
                New
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <Dropdown open={menu === "model"} onClose={() => setMenu(null)} align="left">
            <div className="w-64 max-h-[60vh] overflow-y-auto rounded-xl border border-[var(--neutral-grey200)] bg-white py-1 shadow-[var(--shadow-card)]">
              {MODELS.map((m) => {
                const on = m.id === model;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onModelChange(m.id);
                      setMenu(null);
                    }}
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--neutral-grey60)] ${
                      on ? "bg-[var(--neutral-grey60)]" : ""
                    }`}
                  >
                    <span className="mt-0.5 flex h-4 w-4 items-center justify-center">
                      {on && <Check className="h-3.5 w-3.5 text-[var(--brand-brand03-blue)]" strokeWidth={2.5} />}
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-icon-text-1)]">
                        {m.name}
                        {m.badge && (
                          <span className="rounded bg-[var(--beta-bg)] px-1 text-[9px] leading-tight text-[var(--beta-text)]">
                            {m.badge}
                          </span>
                        )}
                      </span>
                      {m.desc && (
                        <span className="mt-0.5 block text-[11px] text-[var(--text-icon-text-4)]">{m.desc}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </Dropdown>
        </div>

        <div className="flex-1" />

        {costLabel && (
          <span className="hidden whitespace-nowrap text-[11px] text-[var(--text-icon-text-5)] sm:inline">
            ⏎ 发送 · ⇧⏎ 换行 · {costLabel}
          </span>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || sending}
          aria-label="发送"
          className="hit-40 flex h-8 w-8 items-center justify-center rounded-full text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.96] disabled:opacity-30"
          style={{ backgroundImage: "var(--gradient-brand)", boxShadow: "var(--shadow-glow-emerald)" }}
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      <AgentSkillPicker
        key={`${picker.open ? "open" : "closed"}-${picker.tab}`}
        open={picker.open}
        initialTab={picker.tab}
        mountedAgent={mountedAgent}
        mountedSkills={mountedSkills}
        onClose={() => setPicker((p) => ({ ...p, open: false }))}
        onAgentChange={onAgentChange}
        onSkillsChange={onSkillsChange}
      />
    </div>
  );
}
