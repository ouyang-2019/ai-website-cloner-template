"use client";

import { Wrench, Check, Loader2 } from "lucide-react";
import type { MessageToolCall } from "@/types";

/**
 * 工具调用芯片行 —— 每个工具一个 chip：图标 + 名称 + 状态点。
 * 替代原先把「正在调用工具：xxx」当纯文本拼接进气泡的做法。
 */
export function ToolCallChips({ calls, className = "" }: { calls: MessageToolCall[]; className?: string }) {
  if (!calls || calls.length === 0) return null;
  return (
    <div className={`mb-2 flex flex-wrap gap-1.5 ${className}`}>
      {calls.map((c, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--glass-border-subtle)] bg-[var(--neutral-grey60)]/60 px-2 py-1 text-[11px] text-[var(--text-icon-text-2)]"
        >
          <Wrench className="h-3 w-3 text-[var(--brand-brand03-blue)]" strokeWidth={2} />
          <span className="font-mono">{c.tool}</span>
          {c.summary && <span className="max-w-[120px] truncate text-[var(--text-icon-text-4)]">{c.summary}</span>}
          {c.status === "running" ? (
            <Loader2 className="h-3 w-3 animate-spin text-[var(--text-icon-text-4)]" strokeWidth={2} />
          ) : (
            <Check className="h-3 w-3 text-[var(--brand-brand03-blue)]" strokeWidth={3} />
          )}
        </span>
      ))}
    </div>
  );
}
