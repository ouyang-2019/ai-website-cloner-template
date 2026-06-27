"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Archive, ArchiveRestore, FolderInput, Trash2 } from "lucide-react";
import type { ChatSession } from "@/types";

interface MiniProject {
  id: string;
  name: string;
}

interface Props {
  session: ChatSession;
  /** 可移动到的目标项目（不含当前项目）。 */
  projects: MiniProject[];
  onRename: (id: string, title: string) => void;
  onToggleArchive: (id: string) => void;
  onMove: (id: string, projectId: string) => void;
  onDelete: (id: string) => void;
}

/**
 * 会话行内操作菜单（hover 显示 ⋯）。
 * 重命名 / 归档(取消) / 移动到项目 / 删除。
 */
export function SessionActionsMenu({ session, projects, onRename, onToggleArchive, onMove, onDelete }: Props) {
  const [open, setOpen] = useState(false);

  const handleRename = () => {
    const title = window.prompt("重命名会话", session.title);
    if (title && title.trim()) onRename(session.id, title.trim());
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="会话操作"
        className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-icon-text-4)] transition-colors hover:bg-[var(--neutral-grey100)] hover:text-[var(--text-icon-text-2)]"
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); setOpen(false); }} aria-hidden />
          <div
            className="glass-strong absolute right-0 top-7 z-[70] w-48 overflow-hidden rounded-xl py-1 shadow-[var(--shadow-glass)]"
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem icon={Pencil} label="重命名" onClick={handleRename} />
            <MenuItem
              icon={session.archived ? ArchiveRestore : Archive}
              label={session.archived ? "取消归档" : "归档"}
              onClick={() => {
                onToggleArchive(session.id);
                setOpen(false);
              }}
            />
            <MoveSubmenu
              projects={projects}
              onPick={(pid) => {
                onMove(session.id, pid);
                setOpen(false);
              }}
            />
            <div className="my-1 border-t border-[var(--neutral-grey100)]" />
            <MenuItem
              icon={Trash2}
              label="删除"
              danger
              onClick={() => {
                if (window.confirm("确定删除该会话？删除后不可恢复。")) {
                  onDelete(session.id);
                }
                setOpen(false);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-[var(--neutral-grey60)] ${
        danger ? "text-[#e5484d]" : "text-[var(--text-icon-text-2)]"
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} /> {label}
    </button>
  );
}

/** 移动到项目 — 展开式子列表（非悬浮二级菜单，避免嵌套定位问题）。 */
function MoveSubmenu({ projects, onPick }: { projects: MiniProject[]; onPick: (pid: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--text-icon-text-2)] transition-colors hover:bg-[var(--neutral-grey60)]"
      >
        <FolderInput className="h-4 w-4" strokeWidth={1.75} /> 移动到项目
        <span className="ml-auto text-[var(--text-icon-text-4)]">{expanded ? "▴" : "▾"}</span>
      </button>
      {expanded && (
        <div className="max-h-40 overflow-y-auto">
          {projects.length === 0 ? (
            <div className="px-9 py-1.5 text-[12px] text-[var(--text-icon-text-5)]">无可用项目</div>
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPick(p.id)}
                className="block w-full truncate px-9 py-1.5 text-left text-[12px] text-[var(--text-icon-text-3)] transition-colors hover:bg-[var(--neutral-grey60)] hover:text-[var(--text-icon-text-1)]"
              >
                {p.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
