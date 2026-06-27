"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AgentCard } from "@/components/agent-card";
import { TEMPLATE_CARDS, AGENT_CATEGORIES } from "@/data/content";
import { categoryCounts } from "@/lib/agents";
import { getAgentRunCost } from "@/lib/credits";
import { apiFetch } from "@/lib/api";
import type { AgentCategory, TemplateCard } from "@/types";

type CatFilter = "全部" | AgentCategory;

const SCOPES = ["全部", "公开", "我的"] as const;
type Scope = (typeof SCOPES)[number];

const SORTS = [
  { key: "hot", label: "最热" },
  { key: "new", label: "最新" },
  { key: "cost", label: "积分低到高" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

const PAGE_SIZE = 24;

export default function ExplorePage() {
  const [scope, setScope] = useState<Scope>("全部");
  const [category, setCategory] = useState<CatFilter>("全部");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("hot");
  const [remoteCards, setRemoteCards] = useState<Array<{ id: number; card: TemplateCard }> | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const counts = useMemo(() => categoryCounts(), []);

  useEffect(() => {
    apiFetch<{ items: Array<TemplateCard & { id: number }>; total: number }>("/agents?page=1&size=100")
      .then((data) => setRemoteCards(data.items.map(({ id, ...card }) => ({ id, card }))))
      .catch(() => setRemoteCards(null));
  }, []);

  const list = useMemo(() => {
    let items = (remoteCards ?? TEMPLATE_CARDS.map((card, i) => ({ id: i + 1, card }))).map((it) => ({
      ...it,
      cost: getAgentRunCost(it.card),
    }));
    if (scope === "我的") items = items.slice(0, 4);
    if (category !== "全部") items = items.filter((it) => it.card.category === category);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter((it) => (it.card.title + it.card.tagline).toLowerCase().includes(q));
    }
    if (sort === "new") items = [...items].reverse();
    if (sort === "cost") items = [...items].sort((a, b) => a.cost - b.cost);
    return items;
  }, [scope, category, query, sort, remoteCards]);

  // Infinite scroll: load next batch when sentinel enters viewport.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (visibleCount >= list.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, list.length));
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visibleCount, list.length]);

  const filters: CatFilter[] = ["全部", ...AGENT_CATEGORIES.map((c) => c.key)];

  return (
    <AppShell>
      <div className="scrollbar-hide bg-homepage flex-1 overflow-auto">
        <div className="mx-auto max-w-[1200px] px-6 py-6">
          {/* Header */}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-[22px] font-bold text-[var(--brand-brand01-black)]">
                <Sparkles className="h-5 w-5 text-[var(--brand-brand03-blue)]" strokeWidth={2} />
                探索智能体
              </h1>
              <p className="mt-1 text-[13px] text-[var(--text-icon-text-4)]">
                {(remoteCards?.length ?? TEMPLATE_CARDS.length)} 个真实能力智能体 · 基于 AUBEAU 能力体系 · 一键运行或加入工作流
              </p>
            </div>
            <Link
              href="/"
              className="hidden text-[13px] text-[var(--text-icon-text-4)] hover:text-[var(--text-icon-text-2)] md:inline"
            >
              ← 返回工作台
            </Link>
          </div>

          {/* Scope tabs */}
          <div className="mt-5 flex items-center gap-1 border-b border-[var(--neutral-grey200)]">
            {SCOPES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setScope(s);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`-mb-px border-b-2 px-4 py-2.5 text-[14px] font-medium transition-colors ${
                  scope === s
                    ? "border-[var(--brand-brand01-black)] text-[var(--brand-brand01-black)]"
                    : "border-transparent text-[var(--text-icon-text-4)] hover:text-[var(--text-icon-text-2)]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Filter bar */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search
                className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-icon-text-4)]"
                strokeWidth={2}
              />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="搜索智能体名称或能力…"
                className="h-9 w-full rounded-lg border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] pl-8 pr-3 text-[13px] outline-none backdrop-blur-[12px] transition-colors placeholder:text-[var(--text-icon-text-5)] focus:border-[var(--brand-brand03-blue)]"
              />
            </div>
            <div className="ml-auto inline-flex items-center gap-1 rounded-lg border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] px-1 py-0.5 backdrop-blur-[12px]">
              <SlidersHorizontal className="ml-1.5 h-3.5 w-3.5 text-[var(--text-icon-text-4)]" strokeWidth={2} />
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setSort(s.key);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`rounded-md px-2.5 py-1 text-[12px] transition-colors ${
                    sort === s.key
                      ? "bg-[var(--brand-brand01-black)] text-white"
                      : "text-[var(--text-icon-text-3)] hover:text-[var(--text-icon-text-1)]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category pills — 6 capability categories with live counts */}
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.map((c) => {
              const meta = AGENT_CATEGORIES.find((x) => x.key === c);
              const count = c === "全部" ? (remoteCards?.length ?? TEMPLATE_CARDS.length) : counts[c];
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategory(c);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
                    active
                      ? "border-transparent text-white"
                      : "border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] text-[var(--text-icon-text-3)] backdrop-blur-[12px] hover:border-[var(--brand-emerald-200)]"
                  }`}
                  style={active ? { backgroundColor: meta?.accent ?? "#000818" } : undefined}
                >
                  {meta && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: active ? "#fff" : meta.accent }}
                    />
                  )}
                  {c === "全部" ? "全部" : meta?.label}
                  <span className={active ? "text-[11px] opacity-80" : "text-[11px] text-[var(--text-icon-text-5)]"}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Grid */}
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] backdrop-blur-[12px]">
                <Search className="h-5 w-5 text-[var(--text-icon-text-4)]" strokeWidth={2} />
              </div>
              <p className="text-[14px] font-medium text-[var(--text-icon-text-2)]">未找到匹配的智能体</p>
              <p className="mt-1 text-[12px] text-[var(--text-icon-text-4)]">试着调整搜索或分类筛选</p>
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-2 gap-4 pb-12 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {list.slice(0, visibleCount).map((it) => (
                  <AgentCard key={it.id} id={it.id} card={it.card} />
                ))}
              </div>
              {visibleCount < list.length && (
                <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
