"use client";

import { useState } from "react";
import {
  FileText,
  Presentation,
  Film,
  Radio,
  FileBarChart,
  ChevronDown,
  Package,
  type LucideIcon,
} from "lucide-react";
import type { ArtifactType } from "@/types";

const TYPE_ICON: Record<ArtifactType, LucideIcon> = {
  report: FileBarChart,
  doc: FileText,
  ppt: Presentation,
  video: Film,
  channel: Radio,
};

/** 工件历史项（聚合自项目所有会话的消息 artifacts）。 */
export interface ArtifactHistoryItem {
  artifactId: string;
  type: ArtifactType;
  title?: string;
  /** 来源会话标题（区分不同会话的产物）。 */
  sessionTitle: string;
}

/**
 * 项目工件历史侧栏（会话列表底部折叠区）。
 * 聚合本项目所有已加载会话的 artifacts，对标天工侧边产物管理：
 * 列表 + 来源会话 + 点击在画布打开。
 */
export function ArtifactHistory({
  items,
  activeId,
  onActivate,
}: {
  items: ArtifactHistoryItem[];
  activeId: string;
  onActivate: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="shrink-0 border-t border-[var(--glass-border-subtle)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-left transition-colors hover:bg-[var(--neutral-grey60)]"
      >
        <Package className="h-3.5 w-3.5 shrink-0 text-[var(--brand-brand03-blue)]" strokeWidth={2} />
        <span className="text-[11px] font-medium text-[var(--text-icon-text-2)]">项目工件</span>
        <span className="rounded-full bg-[var(--neutral-grey100)] px-1.5 text-[10px] tabular-nums text-[var(--text-icon-text-4)]">
          {items.length}
        </span>
        <ChevronDown
          className={`ml-auto h-3.5 w-3.5 shrink-0 text-[var(--text-icon-text-4)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>
      {open && (
        <div className="max-h-[240px] overflow-y-auto px-2 pb-2">
          {items.length === 0 ? (
            <p className="px-2 py-3 text-[11px] leading-[16px] text-[var(--text-icon-text-4)]">
              暂无工件。智能体发布产物（报告 / 文档 / PPT）后，将在此汇总，点击可在画布查看。
            </p>
          ) : (
            items.map((a, i) => {
              const Icon = TYPE_ICON[a.type] ?? FileText;
              const on = a.artifactId === activeId;
              return (
                <button
                  key={`${a.artifactId}-${i}`}
                  type="button"
                  onClick={() => onActivate(a.artifactId)}
                  title={a.title ?? a.artifactId}
                  className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                    on ? "bg-[var(--neutral-grey100)]" : "hover:bg-[var(--neutral-grey60)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--brand-brand03-blue)]" strokeWidth={2} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] text-[var(--text-icon-text-2)]">
                      {a.title ?? a.artifactId.slice(0, 8)}
                    </span>
                    <span className="block truncate text-[10px] text-[var(--text-icon-text-5)]">{a.sessionTitle}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
