"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Plus, Play, Pause, Calendar, Zap, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useCredits } from "@/components/credits/credits-provider";
import { TEMPLATE_CARDS } from "@/data/content";
import { getAgentRunCost } from "@/lib/credits";
import { apiFetch } from "@/lib/api";

interface ScheduledTask {
  id: string;
  agentId: number;
  scheduleHuman: string;
  cron: string;
  status: "running" | "paused";
  lastRun: string;
  nextRun: string;
  totalRuns: number;
}

const TASKS: ScheduledTask[] = [
  { id: "st-1", agentId: 7, scheduleHuman: "每天 09:00", cron: "0 9 * * *", status: "running", lastRun: "今天 09:00", nextRun: "明天 09:00", totalRuns: 142 },
  { id: "st-2", agentId: 8, scheduleHuman: "每周一 10:00", cron: "0 10 * * 1", status: "running", lastRun: "本周一 10:00", nextRun: "下周一 10:00", totalRuns: 38 },
  { id: "st-3", agentId: 4, scheduleHuman: "每小时整点", cron: "0 * * * *", status: "running", lastRun: "1 小时前", nextRun: "下一个整点", totalRuns: 1290 },
  { id: "st-4", agentId: 6, scheduleHuman: "每天 18:30", cron: "30 18 * * *", status: "paused", lastRun: "3 天前", nextRun: "—", totalRuns: 76 },
  { id: "st-5", agentId: 3, scheduleHuman: "每月 1 号 00:00", cron: "0 0 1 * *", status: "running", lastRun: "本月 1 号", nextRun: "下月 1 号", totalRuns: 12 },
];

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "running", label: "运行中" },
  { key: "paused", label: "已暂停" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

function StatusPill({ status }: { status: ScheduledTask["status"] }) {
  const running = status === "running";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        running ? "bg-[#e7f7f0] text-[#00a371]" : "bg-[var(--neutral-grey100)] text-[var(--text-icon-text-4)]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${running ? "bg-[#00c281]" : "bg-[var(--neutral-grey400)]"}`} />
      {running ? "运行中" : "已暂停"}
    </span>
  );
}

export default function ScheduledTasksPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [tasks, setTasks] = useState(TASKS);
  const { showToast } = useCredits();

  useEffect(() => {
    apiFetch<Array<ScheduledTask & { title?: string; lastRun?: string | null; nextRun?: string | null }>>("/scheduled-tasks")
      .then((items) =>
        setTasks(
          items.map((item) => ({
            id: item.id,
            agentId: item.agentId,
            scheduleHuman: item.scheduleHuman ?? item.cron,
            cron: item.cron,
            status: item.status,
            lastRun: item.lastRun ?? "—",
            nextRun: item.nextRun ?? "—",
            totalRuns: item.totalRuns,
          }))
        )
      )
      .catch(() => setTasks(TASKS));
  }, []);

  const visible = tasks.filter((t) => (filter === "all" ? true : t.status === filter));

  const toggle = (id: string) => {
    const current = tasks.find((t) => t.id === id);
    const nextStatus = current?.status === "running" ? "paused" : "running";
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
    );
    void apiFetch(`/scheduled-tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    }).catch(() => {
      showToast("定时任务状态已在本地更新，后端同步失败", "limit");
    });
  };

  return (
    <AppShell>
      <div className="scrollbar-hide bg-homepage flex-1 overflow-auto">
        <div className="mx-auto max-w-[1100px] px-6 py-6">
          {/* Header */}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-[22px] font-bold text-[var(--brand-brand01-black)]">
                <Clock className="h-5 w-5 text-[var(--brand-brand03-blue)]" strokeWidth={2} />
                自主触发
              </h1>
              <p className="mt-1 text-[13px] text-[var(--text-icon-text-4)]">
                定时与事件驱动的智能体任务，按计划自动运行并消耗积分
              </p>
            </div>
            <button
              type="button"
              onClick={() => showToast("新建定时任务（占位）", "info")}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--brand-brand01-black)] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              新建定时任务
            </button>
          </div>

          {/* Filters */}
          <div className="mt-5 inline-flex items-center gap-1 rounded-lg border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] p-1 backdrop-blur-[12px] shadow-[var(--shadow-card)]">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-md px-3 py-1 text-[13px] transition-colors ${
                  filter === f.key
                    ? "bg-[var(--brand-brand01-black)] text-white"
                    : "text-[var(--text-icon-text-3)] hover:text-[var(--text-icon-text-1)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          {visible.length === 0 ? (
            <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--glass-border-subtle)] bg-[var(--glass-bg-soft)] py-20 text-center backdrop-blur-[12px]">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] backdrop-blur-[12px]">
                <Clock className="h-5 w-5 text-[var(--text-icon-text-4)]" strokeWidth={2} />
              </div>
              <p className="text-[14px] font-medium text-[var(--text-icon-text-2)]">暂无定时任务</p>
              <p className="mt-1 text-[12px] text-[var(--text-icon-text-4)]">创建一个定时任务，让智能体按计划自动运行</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3 pb-12">
              {visible.map((t) => {
                const card = TEMPLATE_CARDS[t.agentId - 1];
                const cost = card ? getAgentRunCost(card) : 2;
                return (
                  <div
                    key={t.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] p-4 shadow-[var(--shadow-card)] backdrop-blur-[18px] saturate-150 transition-[border-color,box-shadow] hover:border-[var(--brand-emerald-200)] hover:shadow-[var(--shadow-glass)] sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/agents/${t.agentId}`}
                          className="truncate text-[15px] font-medium text-[var(--brand-brand01-black)] hover:underline"
                        >
                          {card?.title}
                        </Link>
                        <StatusPill status={t.status} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--text-icon-text-4)]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" strokeWidth={2} /> {t.scheduleHuman}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5" strokeWidth={2} /> {cost} 积分/次
                        </span>
                        <span className="font-mono text-[11px] text-[var(--text-icon-text-5)]">{t.cron}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 text-[12px] text-[var(--text-icon-text-4)]">
                      <div>
                        <div className="text-[11px] text-[var(--text-icon-text-5)]">上次运行</div>
                        <div className="text-[var(--text-icon-text-2)]">{t.lastRun}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[var(--text-icon-text-5)]">下次运行</div>
                        <div className="text-[var(--text-icon-text-2)]">{t.nextRun}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[var(--text-icon-text-5)]">累计</div>
                        <div className="text-[var(--text-icon-text-2)]">{t.totalRuns} 次</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggle(t.id)}
                      aria-label={t.status === "running" ? "暂停" : "启用"}
                      className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--neutral-grey300)] bg-white text-[var(--text-icon-text-3)] transition-colors hover:bg-[var(--neutral-grey60)]"
                    >
                      {t.status === "running" ? (
                        <Pause className="h-4 w-4" strokeWidth={2} />
                      ) : (
                        <Play className="h-4 w-4" strokeWidth={2} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Hint */}
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg-soft)] px-4 py-3 text-[12px] text-[var(--text-icon-text-4)] backdrop-blur-[12px]">
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            自主触发能力需 <b className="mx-1 text-[var(--text-icon-text-2)]">Pro</b> 及以上套餐。前往
            <Link href="/pricing" className="ml-1 text-[var(--brand-brand03-blue)] hover:underline">定价</Link>
            了解详情。
          </div>
        </div>
      </div>
    </AppShell>
  );
}
