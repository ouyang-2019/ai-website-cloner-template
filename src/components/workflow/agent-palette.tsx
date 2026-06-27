"use client";

import { useMemo, useState, type DragEvent } from "react";
import { Search } from "lucide-react";

import { TEMPLATE_CARDS } from "@/data/content";
import { categoryMeta } from "@/lib/agents";
import type { AgentCategory } from "@/types";
import { cn } from "@/lib/utils";

/** 左侧智能体调色板 — 可拖拽生成画布节点。 */
export function AgentPalette() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TEMPLATE_CARDS.map((card, i) => ({ id: i + 1, card }));
    return TEMPLATE_CARDS.map((card, i) => ({ id: i + 1, card })).filter(
      ({ card }) =>
        card.title.toLowerCase().includes(q) ||
        card.tagline.toLowerCase().includes(q) ||
        categoryMeta(card.category).label.toLowerCase().includes(q)
    );
  }, [query]);

  const handleDragStart = (event: DragEvent, agentId: number) => {
    event.dataTransfer.setData("application/agent-id", String(agentId));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="flex h-full w-[240px] flex-col border-r border-[#22272F] bg-[#11141A]">
      {/* 头部 */}
      <div className="px-4 pb-2 pt-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[13px] font-semibold text-[#F5F7FA]">智能体</h2>
          <span className="tabular-nums text-[11px] text-[#6B7280]">
            {filtered.length}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-[#6B7280]">
          拖拽到画布添加为节点
        </p>
      </div>

      {/* 搜索 */}
      <div className="px-3 pb-2">
        <div className="flex h-8 items-center gap-2 rounded-[8px] border border-[#22272F] bg-[#1A1E26] px-2.5 transition-colors focus-within:border-[#6E8BFF] focus-within:bg-[#1F2430]">
          <Search className="h-3.5 w-3.5 shrink-0 text-[#6B7280]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索智能体"
            className="h-full w-full bg-transparent text-[12px] text-[#F5F7FA] outline-none placeholder:text-[#525965]"
          />
        </div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {filtered.map(({ id, card }) => {
          const accent = categoryMeta(card.category as AgentCategory).accent;
          return (
            <div
              key={id}
              draggable
              onDragStart={(e) => handleDragStart(e, id)}
              className={cn(
                "group flex cursor-grab items-center gap-2.5 rounded-[8px] px-2 py-1.5",
                "transition-colors hover:bg-[#1A1E26] active:scale-[0.98] active:cursor-grabbing"
              )}
              title={card.tagline}
            >
              {/* 缩略封面 */}
              <div className="h-7 w-7 shrink-0 overflow-hidden rounded-[6px] bg-[#222631]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.cover}
                  alt={card.title}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
              {/* 标题 */}
              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 text-[12px] font-medium leading-tight text-[#E5E9F0]">
                  {card.title}
                </div>
                <div className="line-clamp-1 text-[10px] leading-tight text-[#6B7280]">
                  {categoryMeta(card.category as AgentCategory).label}
                </div>
              </div>
              {/* 类别强调色圆点 */}
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: accent }}
              />
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-2 py-8 text-center text-[11px] text-[#6B7280]">
            未找到匹配的智能体
          </div>
        )}
      </div>
    </aside>
  );
}
