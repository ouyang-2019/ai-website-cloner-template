"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SKILLS, type SkillEntry } from "@/data/skills";
import { AGENT_CATEGORIES } from "@/data/content";
import { categoryMeta } from "@/lib/agents";
import { apiFetch } from "@/lib/api";
import type { AgentCategory } from "@/types";

type CatFilter = "全部" | AgentCategory;

function SkillCard({ skill }: { skill: SkillEntry }) {
  const meta = categoryMeta(skill.category);
  return (
    <Link
      href={skill.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] shadow-[var(--shadow-card)] backdrop-blur-[18px] saturate-150 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-emerald-200)] hover:shadow-[var(--shadow-glass)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--neutral-grey100)]">
        <Image
          src={skill.cover}
          alt={skill.name}
          fill
          sizes="(max-width:768px) 50vw, 280px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <span
          className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur"
          style={{ backgroundColor: meta.accent }}
        >
          {meta.label}
        </span>
        {skill.badge && (
          <span
            className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              skill.badge === "热门"
                ? "bg-[#ff576d] text-white"
                : "bg-[var(--brand-brand04-green)] text-white"
            }`}
          >
            {skill.badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-[14px] font-semibold text-[var(--brand-brand01-black)]">{skill.name}</p>
        <p className="mt-1 line-clamp-2 flex-1 text-[12px] leading-[17px] text-[var(--text-icon-text-4)]">
          {skill.desc}
        </p>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="inline-flex items-center gap-1 text-[var(--text-icon-text-4)]">
            <TrendingUp className="h-3 w-3" strokeWidth={2} /> {skill.uses} 次使用
          </span>
          <span className="inline-flex items-center gap-0.5 font-medium" style={{ color: meta.accent }}>
            进入 <ArrowRight className="h-3 w-3" strokeWidth={2} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function SkillsPage() {
  const [category, setCategory] = useState<CatFilter>("全部");
  const [query, setQuery] = useState("");
  const [remoteSkills, setRemoteSkills] = useState<SkillEntry[] | null>(null);
  const filters: CatFilter[] = ["全部", ...AGENT_CATEGORIES.map((c) => c.key)];

  useEffect(() => {
    apiFetch<SkillEntry[]>("/skills")
      .then(setRemoteSkills)
      .catch(() => setRemoteSkills(null));
  }, []);

  const list = useMemo(() => {
    let items = remoteSkills ?? SKILLS;
    if (category !== "全部") items = items.filter((s) => s.category === category);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter((s) => (s.name + s.desc).toLowerCase().includes(q));
    }
    return items;
  }, [category, query, remoteSkills]);

  return (
    <AppShell>
      <div className="scrollbar-hide bg-homepage flex-1 overflow-auto">
        <div className="mx-auto max-w-[1200px] px-6 py-6">
          {/* Header */}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-[22px] font-bold text-[var(--brand-brand01-black)]">
                <Sparkles className="h-5 w-5 text-[var(--brand-brand03-blue)]" strokeWidth={2} />
                技能广场
              </h1>
              <p className="mt-1 text-[13px] text-[var(--text-icon-text-4)]">
                {(remoteSkills?.length ?? SKILLS.length)} 个创作技能 · 选择技能一键进入智能体工作流 · PPT / 文档 / 表格 / 网站 / 视频 / 研究
              </p>
            </div>
            <Link
              href="/"
              className="hidden text-[13px] text-[var(--text-icon-text-4)] hover:text-[var(--text-icon-text-2)] md:inline"
            >
              ← 返回工作台
            </Link>
          </div>

          {/* Search */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search
                className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-icon-text-4)]"
                strokeWidth={2}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索技能…"
                className="h-9 w-full rounded-lg border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] pl-8 pr-3 text-[13px] outline-none backdrop-blur-[12px] transition-colors placeholder:text-[var(--text-icon-text-5)] focus:border-[var(--brand-brand03-blue)]"
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.map((c) => {
              const meta = AGENT_CATEGORIES.find((x) => x.key === c);
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
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
              <p className="text-[14px] font-medium text-[var(--text-icon-text-2)]">未找到匹配的技能</p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4 pb-12 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {list.map((s) => (
                <SkillCard key={s.id} skill={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
