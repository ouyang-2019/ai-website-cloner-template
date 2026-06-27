"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FolderClosed, Plus, Search, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useCredits } from "@/components/credits/credits-provider";
import { PROJECTS, type Project } from "@/data/projects";
import { apiFetch } from "@/lib/api";

const STATUS_LABELS: Record<Project["status"], { label: string; cls: string }> = {
  active: { label: "进行中", cls: "bg-[#e7f7f0] text-[#00a371]" },
  idle: { label: "空闲", cls: "bg-[var(--neutral-grey100)] text-[var(--text-icon-text-4)]" },
  archived: { label: "已归档", cls: "bg-[var(--neutral-grey100)] text-[var(--text-icon-text-5)]" },
};

export default function ProjectsPage() {
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const { showToast } = useCredits();

  useEffect(() => {
    apiFetch<Project[]>("/projects")
      .then(setProjects)
      .catch(() => setProjects(PROJECTS));
  }, []);

  const list = useMemo(() => {
    if (!query.trim()) return projects;
    const q = query.trim().toLowerCase();
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, query]);

  return (
    <AppShell>
      <div className="scrollbar-hide bg-homepage flex-1 overflow-auto">
        <div className="mx-auto max-w-[1200px] px-6 py-6">
          {/* Header */}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-[22px] font-bold text-[var(--brand-brand01-black)]">
                <FolderClosed className="h-5 w-5 text-[var(--brand-brand03-blue)]" strokeWidth={2} />
                我的智能体
              </h1>
              <p className="mt-1 text-[13px] text-[var(--text-icon-text-4)]">
                管理你创建与运行的智能体项目，查看用量与状态
              </p>
            </div>
            <div className="relative w-56 max-w-full">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-icon-text-4)]" strokeWidth={2} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索项目…"
                className="h-9 w-full rounded-lg border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] pl-8 pr-3 text-[13px] outline-none backdrop-blur-[12px] transition-colors placeholder:text-[var(--text-icon-text-5)] focus:border-[var(--brand-brand03-blue)]"
              />
            </div>
          </div>

          {/* Grid */}
          <div className="mt-5 grid grid-cols-2 gap-4 pb-12 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {/* New project card */}
            <button
              type="button"
              onClick={() => showToast("新建智能体项目（占位）", "info")}
              className="flex aspect-[286/208] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] p-3 backdrop-blur-[18px] saturate-150 transition-colors hover:border-[var(--brand-emerald-200)] hover:bg-[var(--glass-bg-strong)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-brand01-black)] text-white">
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="text-[13px] font-medium text-[var(--text-icon-text-2)]">新建项目</span>
            </button>

            {list.map((p) => {
              const st = STATUS_LABELS[p.status];
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] shadow-[var(--shadow-card)] backdrop-blur-[18px] saturate-150 transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-[var(--brand-emerald-200)] hover:shadow-[var(--shadow-glass)]"
                >
                  <div className="relative aspect-[286/168] w-full overflow-hidden bg-[var(--neutral-grey100)]">
                    <Image src={p.cover} alt={p.name} fill sizes="240px" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                    <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="line-clamp-1 text-[14px] font-medium text-[var(--brand-brand01-black)]">{p.name}</p>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--text-icon-text-4)]">
                      <span>更新于 {p.updatedAt}</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Zap className="h-3 w-3" strokeWidth={2} /> {p.creditsUsed}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
