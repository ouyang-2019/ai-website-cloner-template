"use client";

import { useState } from "react";
import { Brain, ChevronDown, Check } from "lucide-react";
import type { MessageReasoningStep } from "@/types";

/**
 * 思考过程时间线（可折叠）。
 * - 流式中（active=true）强制展开、末步显示动画点。
 * - 完成后默认展开，可手动折叠为「已完成 N 步」摘要。
 * 对标天工：把单调进度条升级为分步骤时间线。
 */
export function ReasoningTimeline({
  steps,
  active,
  className = "",
}: {
  steps: MessageReasoningStep[];
  /** true=正在流式生成（强制展开，末步进行中）。 */
  active: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(true);
  const expanded = active || open;
  if (!steps || steps.length === 0) return null;
  const last = steps[steps.length - 1];

  return (
    <div
      className={`mb-2 rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--neutral-grey60)]/60 ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <Brain className="h-3.5 w-3.5 shrink-0 text-[var(--brand-brand03-blue)]" strokeWidth={2} />
        <span className="text-[12px] font-medium text-[var(--text-icon-text-2)]">
          {active ? "思考中…" : `已完成 ${steps.length} 步`}
        </span>
        {!active && (
          <span className="ml-1 truncate text-[11px] text-[var(--text-icon-text-4)]">{last.step}</span>
        )}
        <ChevronDown
          className={`ml-auto h-3.5 w-3.5 shrink-0 text-[var(--text-icon-text-4)] transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>
      {expanded && (
        <ol className="space-y-1.5 px-3 pb-2.5">
          {steps.map((s, i) => {
            const done = i < steps.length - 1 || !active;
            return (
              <li key={i} className="flex items-center gap-2 text-[12px]">
                <span
                  className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${
                    done
                      ? "bg-[var(--brand-brand03-blue)] text-white"
                      : "border border-[var(--brand-brand03-blue)]"
                  }`}
                >
                  {done ? (
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  ) : (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand-brand03-blue)]" />
                  )}
                </span>
                <span className={done ? "text-[var(--text-icon-text-3)]" : "font-medium text-[var(--text-icon-text-1)]"}>
                  {s.step}
                </span>
                {s.pct > 0 && (
                  <span className="ml-auto tabular-nums text-[10px] text-[var(--text-icon-text-5)]">{s.pct}%</span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
