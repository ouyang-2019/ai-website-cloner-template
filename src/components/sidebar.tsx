"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus,
  Compass,
  Clock,
  FolderClosed,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Home,
  BookOpen,
  Workflow,
  PanelLeftClose,
  PanelLeftOpen,
  Link2,
  FileText,
  Crown,
  ChevronLeft,
  X,
} from "lucide-react";
import { NAV_ITEMS, SIDE_PANEL_ITEMS, SKILL_ACTIONS } from "@/data/content";
import { SKILL_ICONS } from "@/components/icons";
import { useCredits } from "@/components/credits/credits-provider";
import type { NavItem, SidePanelItem } from "@/types";

/** Icon resolver for primary rail + secondary panel. */
function NavIcon({ name, className }: { name: NavItem["icon"] | SidePanelItem["icon"]; className?: string }) {
  const map = {
    plus: Plus,
    compass: Compass,
    clock: Clock,
    folder: FolderClosed,
    sparkles: Sparkles,
    home: Home,
    book: BookOpen,
    workflow: Workflow,
  } as const;
  const Icon = map[name];
  return <Icon className={className} strokeWidth={1.75} />;
}

/** 主轨道 (60px icon rail) — border-r 1px grey300。含底部折叠/帮助。 */
function PrimaryRail({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="sidebar flex h-full w-[60px] shrink-0 flex-col items-center border-r border-[var(--neutral-grey300)]">
      <div className="collapsed-nav mt-[14px] flex flex-1 flex-col">
        {/* 顶部导航组 */}
        <div className="flex flex-col">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <div key={item.label} className="relative">
                {item.isNew && (
                  <span className="absolute -right-0.5 -top-1 z-10 rounded bg-[var(--brand-brand05-magenta)] px-1 text-[8px] font-medium leading-tight text-white">
                    新
                  </span>
                )}
                <Link
                  href={item.href}
                  aria-label={item.label}
                  title={item.label}
                  className={`mb-[30px] flex w-[40px] cursor-pointer justify-center rounded-lg p-1 pb-1.5 transition-colors ${
                    active ? "bg-white/80" : "hover:bg-[var(--fill-3-hover)]"
                  }`}
                >
                  <NavIcon
                    name={item.icon}
                    className={`h-7 w-7 ${active ? "text-[var(--text-icon-text-2)]" : "text-[var(--text-icon-text-3)]"}`}
                  />
                </Link>
              </div>
            );
          })}
        </div>

        {/* 底部组：项目 + 折叠 + 帮助 */}
        <div className="mt-auto flex flex-col items-center gap-2">
          <Link
            href="/projects"
            aria-label="项目"
            title="项目"
            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg p-1 hover:bg-[var(--fill-3-hover)] ${
              pathname.startsWith("/projects") ? "bg-white/80" : ""
            }`}
          >
            <FolderClosed className="h-[22px] w-[22px] text-[var(--text-icon-text-3)]" strokeWidth={1.75} />
          </Link>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "展开侧栏" : "折叠侧栏"}
            title={collapsed ? "展开侧栏" : "折叠侧栏"}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg p-1 text-[var(--text-icon-text-3)] transition-colors hover:bg-[var(--fill-3-hover)]"
          >
            {collapsed ? <PanelLeftOpen className="h-[20px] w-[20px]" strokeWidth={1.75} /> : <PanelLeftClose className="h-[20px] w-[20px]" strokeWidth={1.75} />}
          </button>
          <button
            type="button"
            aria-label="帮助"
            title="帮助"
            className="guide-container flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg p-1 hover:bg-[var(--fill-3-hover)]"
          >
            <HelpCircle className="h-[22px] w-[22px] text-[var(--text-icon-text-3)]" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </nav>
  );
}

/** 副面板 (230px) — bg 50% white, rounded-tl-20px。 */
function SecondaryPanel({ onOpenFiles, onToggleCollapse }: { onOpenFiles: () => void; onToggleCollapse: () => void }) {
  const pathname = usePathname();
  const { showToast } = useCredits();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="secondary-sidebar relative rounded-tl-[20px] bg-[var(--background-main-7)]">
      <div className="relative flex h-full w-[230px] flex-col p-[14px] pt-[6px]">
        <div className="sidebar-container flex h-full w-full flex-col gap-2 overflow-hidden">
          {/* 顶部：返回首页 + 折叠侧栏（全局显眼） */}
          <div className="flex shrink-0 items-center justify-between px-1 pt-1">
            <Link
              href="/"
              title="返回首页"
              className="flex h-7 items-center gap-1 rounded-md px-1.5 text-[11px] text-[var(--text-icon-text-4)] transition-colors hover:bg-[var(--fill-4)] hover:text-[var(--text-icon-text-2)]"
            >
              <Home className="h-3.5 w-3.5" strokeWidth={1.75} /> 首页
            </Link>
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="折叠侧栏"
              title="折叠侧栏"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[var(--text-icon-text-4)] transition-colors hover:bg-[var(--fill-4)] hover:text-[var(--text-icon-text-2)]"
            >
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>

          {/* 新建智能体 */}
          <div className="shrink-0">
            <Link
              href="/"
              className="hover:bg-[var(--fill-4)] flex w-full items-center gap-2 rounded-lg bg-white px-3 py-2 text-[13px] text-[var(--text-icon-text-4)] transition-colors"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              新建智能体
            </Link>
          </div>

          {/* 导航列表 */}
          <div className="project-list-scroll mt-1 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
            {SIDE_PANEL_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-left transition-colors ${
                    active
                      ? "bg-white text-[var(--text-icon-text-1)]"
                      : "hover:bg-[var(--fill-4)] text-[var(--text-icon-text-2)]"
                  }`}
                >
                  <NavIcon name={item.icon} className="h-4 w-4 text-[var(--text-icon-text-3)]" />
                  <span className="flex-1 truncate text-[13px]">{item.label}</span>
                  {item.badge && (
                    <span className="rounded bg-[var(--brand-brand05-magenta)] px-1 text-[9px] leading-tight text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* 文件 / 工件侧边面板触发按钮 */}
            <button
              type="button"
              onClick={onOpenFiles}
              className="flex h-10 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[var(--text-icon-text-2)] transition-colors hover:bg-[var(--fill-4)]"
            >
              <Link2 className="h-4 w-4 text-[var(--text-icon-text-3)]" strokeWidth={1.75} />
              <span className="flex-1 truncate text-[13px]">文件与工件</span>
              <ChevronRight className="h-3 w-3 text-[var(--text-icon-text-4)]" strokeWidth={2} />
            </button>
          </div>

          {/* 高级功能区（Pro）—— 原"对话框下方那排"高级能力，点击提示升级 */}
          <div className="shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-icon-text-5)]">
              <Crown className="h-3 w-3 text-[#F59E0B]" strokeWidth={2} />
              高级功能
            </div>
            <div className="flex flex-col gap-0.5">
              {SKILL_ACTIONS.filter((f) => f.icon !== "all" && f.capability !== "im-channel").map((f) => {
                const Icon = SKILL_ICONS[f.icon];
                return (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => showToast(`${f.label} · 升级 Pro 解锁`, "limit")}
                    className="group flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[12px] text-[var(--text-icon-text-3)] transition-colors hover:bg-[var(--fill-4)] hover:text-[var(--text-icon-text-2)]"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">{f.label}</span>
                    <Crown className="h-3 w-3 text-[#F59E0B] opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={2} />
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* 装饰半圆 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/light-half-circle.png"
        alt=""
        aria-hidden
        className="absolute -right-[20px] top-0 h-[20px] w-[20px]"
      />
    </aside>
  );
}

/** 文件 / 工件侧边抽屉（最近产出，演示用）。 */
function FilePanelDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { showToast } = useCredits();
  const items = [
    { id: "f1", name: "精华品类爆品趋势报告.pdf", type: "报告", at: "2 小时前" },
    { id: "f2", name: "防晒配方审核清单.docx", type: "文档", at: "昨天" },
    { id: "f3", name: "竞品六维评分矩阵.xlsx", type: "表格", at: "3 天前" },
    { id: "f4", name: "包装稿一致性差异图.pdf", type: "报告", at: "5 天前" },
  ];
  return (
    <>
      {/* 遮罩 */}
      <div
        className={`fixed inset-0 z-[80] bg-black/20 transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`fixed right-0 top-[54px] z-[90] flex h-[calc(100vh-54px)] w-[320px] flex-col border-l border-[var(--neutral-grey200)] bg-white shadow-[var(--shadow-card)] transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--neutral-grey200)] px-4">
          <span className="text-[14px] font-medium text-[var(--brand-brand01-black)]">文件与工件</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-icon-text-4)] hover:bg-[var(--neutral-grey100)]"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="px-1 pb-2 text-[11px] text-[var(--text-icon-text-5)]">最近的产出工件，可在对话中引用</p>
          <div className="flex flex-col gap-1.5">
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => showToast(`已引用「${it.name}」`, "info")}
                className="flex items-center gap-2.5 rounded-xl border border-[var(--neutral-grey200)] bg-white px-3 py-2.5 text-left transition-colors hover:bg-[var(--neutral-grey60)]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--neutral-grey100)] text-[var(--text-icon-text-3)]">
                  <FileText className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-[var(--text-icon-text-1)]">{it.name}</span>
                  <span className="tabular-nums mt-0.5 block text-[11px] text-[var(--text-icon-text-4)]">{it.type} · {it.at}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

/** 完整侧栏：主轨道 + 副面板（可折叠）。折叠态仅留主轨道。 */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);

  return (
    <>
      <div
        className={`sidebar-wrapper relative flex h-full shrink-0 overflow-hidden pb-8 transition-[width] duration-200 ${
          collapsed ? "w-[60px]" : "w-[290px]"
        }`}
      >
        <PrimaryRail collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
        {!collapsed && (
          <SecondaryPanel onOpenFiles={() => setFilesOpen(true)} onToggleCollapse={() => setCollapsed(true)} />
        )}
      </div>
      {/* 侧栏边缘展开/折叠把手 —— 始终可见，折叠后也能展开 */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? "展开侧栏" : "折叠侧栏"}
        title={collapsed ? "展开侧栏" : "折叠侧栏"}
        className="fixed top-[150px] z-[55] flex h-14 w-5 cursor-pointer items-center justify-center rounded-r-lg border border-l-0 border-[var(--neutral-grey300)] bg-white text-[var(--text-icon-text-3)] shadow-[var(--shadow-card)] transition-[left] duration-200 hover:bg-[var(--neutral-grey60)] hover:text-[var(--text-icon-text-1)]"
        style={{ left: collapsed ? 60 : 290 }}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
        )}
      </button>
      <FilePanelDrawer open={filesOpen} onClose={() => setFilesOpen(false)} />
    </>
  );
}
