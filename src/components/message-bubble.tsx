"use client";

import { useState } from "react";
import {
  Bot,
  User as UserIcon,
  ExternalLink,
  FileText,
  Presentation,
  Film,
  Radio,
  FileBarChart,
  Copy,
  RefreshCw,
  Check,
  type LucideIcon,
} from "lucide-react";
import { MarkdownContent } from "./markdown-content";
import { ReasoningTimeline } from "./reasoning-timeline";
import { ToolCallChips } from "./tool-call-chips";
import type { ChatMessage, ArtifactType } from "@/types";

const ARTIFACT_ICON: Record<ArtifactType, LucideIcon> = {
  report: FileBarChart,
  doc: FileText,
  ppt: Presentation,
  video: Film,
  channel: Radio,
};
const ARTIFACT_LABEL: Record<ArtifactType, string> = {
  report: "报告",
  doc: "文档",
  ppt: "演示",
  video: "视频",
  channel: "渠道",
};

/** assistant 消息操作栏（hover 显示）：复制全文 / 重新生成。对标天工 hover 操作。 */
function AssistantActions({
  text,
  msgId,
  onRegenerate,
}: {
  text: string;
  msgId: string;
  onRegenerate?: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 剪贴板不可用时静默 */
    }
  };
  return (
    <div className="mt-1 flex items-center gap-0.5 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100">
      <button
        type="button"
        onClick={copy}
        aria-label="复制全文"
        className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-icon-text-4)] transition-transform duration-150 ease-out hover:bg-[var(--neutral-grey60)] hover:text-[var(--text-icon-text-2)] active:scale-[0.96]"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-[var(--brand-brand03-blue)]" strokeWidth={2.5} />
        ) : (
          <Copy className="h-3.5 w-3.5" strokeWidth={2} />
        )}
      </button>
      {onRegenerate && (
        <button
          type="button"
          onClick={() => onRegenerate(msgId)}
          aria-label="重新生成"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-icon-text-4)] transition-transform duration-150 ease-out hover:bg-[var(--neutral-grey60)] hover:text-[var(--text-icon-text-2)] active:scale-[0.96]"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

/**
 * 单条消息气泡（替代 page 内联渲染）。
 * - user：黑底白字气泡。
 * - assistant：玻璃气泡，分四区 —— 思考时间线 / 工具芯片 / markdown 正文（流式光标）/ 工件引用卡；
 *   hover 出操作栏（复制全文 / 重新生成）。
 * @param streaming  这条 assistant 消息正在流式生成（驱动思考时间线展开态 + 正文末尾光标）
 * @param onOpenArtifact  点击工件引用卡回调（在同步画布打开该工件）
 * @param onRegenerate  重新生成该消息回调
 */
export function MessageBubble({
  message,
  streaming = false,
  onOpenArtifact,
  onRegenerate,
}: {
  message: ChatMessage;
  streaming?: boolean;
  onOpenArtifact?: (artifactId: string) => void;
  onRegenerate?: (id: string) => void;
}) {
  const m = message;

  if (m.role === "user") {
    return (
      <div className="msg-enter flex flex-row-reverse gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-brand01-black)] text-white">
          <UserIcon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="max-w-[78%] whitespace-pre-wrap rounded-2xl bg-[var(--brand-brand01-black)] px-4 py-2.5 text-[14px] leading-[22px] text-white shadow-[var(--shadow-bubble)]">
          {m.text}
        </div>
      </div>
    );
  }

  const hasReasoning = !!m.reasoning && m.reasoning.length > 0;
  const hasTools = !!m.toolCalls && m.toolCalls.length > 0;
  const hasArtifacts = !!m.artifacts && m.artifacts.length > 0;
  const showTyping = streaming && !m.text && !hasReasoning && !hasTools;

  return (
    <div className="msg-enter flex gap-3">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundImage: "var(--gradient-brand)" }}
      >
        <Bot className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="group flex min-w-0 max-w-[78%] flex-col">
        <div className="rounded-2xl bg-[var(--glass-bg)] px-4 py-3 shadow-[var(--shadow-bubble)] backdrop-blur-[18px] saturate-150 transition-shadow duration-200 hover:shadow-[var(--shadow-bubble-hover)]">
          {hasReasoning && <ReasoningTimeline steps={m.reasoning!} active={streaming} />}
          {hasTools && <ToolCallChips calls={m.toolCalls!} />}
          {m.text && <MarkdownContent text={m.text} streaming={streaming} />}
          {showTyping && (
            <div className="flex items-center gap-1 py-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-icon-text-4)] [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-icon-text-4)] [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-icon-text-4)]" />
            </div>
          )}
        </div>

        {/* 操作栏：复制全文 / 重新生成（hover 显示；流式中隐藏） */}
        {m.text && !streaming && (
          <AssistantActions text={m.text} msgId={m.id} onRegenerate={onRegenerate} />
        )}

        {/* 工件引用卡（点击在画布打开；只存 ID+类型，HTML 不入消息） */}
        {hasArtifacts && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {m.artifacts!.map((a) => {
              const Icon = ARTIFACT_ICON[a.type] ?? FileText;
              const label = ARTIFACT_LABEL[a.type] ?? "产物";
              return (
                <button
                  key={a.artifactId}
                  type="button"
                  onClick={() => onOpenArtifact?.(a.artifactId)}
                  className="group/art inline-flex items-center gap-2 rounded-xl bg-[var(--glass-bg)] px-3 py-2 text-left shadow-[var(--shadow-bubble)] backdrop-blur-[18px] saturate-150 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-bubble-hover)] active:scale-[0.96]"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.05)" }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundImage: "var(--gradient-brand)" }}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block max-w-[180px] truncate text-[12px] font-medium text-[var(--text-icon-text-1)]">
                      {a.title ?? `${label} · ${a.artifactId.slice(0, 6)}`}
                    </span>
                    <span className="block text-[10px] text-[var(--text-icon-text-4)]">{label} · 点击在画布打开</span>
                  </span>
                  <ExternalLink
                    className="h-3.5 w-3.5 shrink-0 text-[var(--text-icon-text-4)] transition-colors group-hover/art:text-[var(--brand-brand03-blue)]"
                    strokeWidth={2}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
