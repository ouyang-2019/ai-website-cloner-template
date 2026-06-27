"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  Link as LinkIcon,
  MoreHorizontal,
  Pencil,
  FolderInput,
  Trash2,
  Plus,
  Search,
  Upload,
  Link2,
  Check,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useCredits } from "@/components/credits/credits-provider";
import { apiFetch } from "@/lib/api";
import {
  KNOWLEDGE_DOCS,
  KNOWLEDGE_FOLDERS,
  KNOWLEDGE_ROOT_FOLDER_ID,
  createKnowledgeFolder,
  createKnowledgeDoc,
} from "@/data/knowledge";
import type { KnowledgeDoc, KnowledgeFolder } from "@/types";

const ALL_DOCS_ID = "__all__";

const SOURCE_META: Record<KnowledgeDoc["source"], { icon: typeof Upload; label: string }> = {
  upload: { icon: Upload, label: "本地上传" },
  link: { icon: LinkIcon, label: "网页链接" },
  drive: { icon: HardDrive, label: "云盘同步" },
};

const STATUS_LABELS: Record<KnowledgeDoc["status"], { label: string; cls: string; dot: string }> = {
  ready: { label: "已就绪", cls: "bg-[#e7f7f0] text-[#00a371]", dot: "bg-[#00a371]" },
  indexing: { label: "向量化中", cls: "bg-[var(--neutral-grey100)] text-[var(--text-icon-text-4)]", dot: "bg-[var(--text-icon-text-4)] animate-pulse" },
  failed: { label: "失败", cls: "bg-[#fde8e8] text-[#e5484d]", dot: "bg-[#e5484d]" },
};

interface OpenMenu {
  kind: "doc" | "folder";
  id: string;
}

function resolveTarget(active: string): string {
  return active === ALL_DOCS_ID ? KNOWLEDGE_FOLDERS[0]?.id ?? KNOWLEDGE_ROOT_FOLDER_ID : active;
}

export default function KnowledgeBasePage() {
  const [query, setQuery] = useState("");
  const [folders, setFolders] = useState<KnowledgeFolder[]>(KNOWLEDGE_FOLDERS);
  const [docs, setDocs] = useState<KnowledgeDoc[]>(KNOWLEDGE_DOCS);
  const [activeId, setActiveId] = useState<string>(ALL_DOCS_ID);
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null);
  const [moveFor, setMoveFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useCredits();

  // 拉取文件夹 / 文档（后端不可用回落种子）
  useEffect(() => {
    apiFetch<KnowledgeFolder[]>("/knowledge-base/folders").then(setFolders).catch(() => setFolders(KNOWLEDGE_FOLDERS));
    apiFetch<KnowledgeDoc[]>("/knowledge-base/docs").then(setDocs).catch(() => setDocs(KNOWLEDGE_DOCS));
  }, []);

  // 点击页面其它处关闭行内 ⋯ 菜单
  useEffect(() => {
    if (!openMenu) return;
    const onDocClick = () => {
      setOpenMenu(null);
      setMoveFor(null);
    };
    window.addEventListener("click", onDocClick);
    return () => window.removeEventListener("click", onDocClick);
  }, [openMenu]);

  const folderCount = (fid: string) => docs.filter((d) => d.folderId === fid).length;

  const visibleDocs = useMemo(() => {
    const inFolder = activeId === ALL_DOCS_ID ? docs : docs.filter((d) => d.folderId === activeId);
    if (!query.trim()) return inFolder;
    const q = query.trim().toLowerCase();
    return inFolder.filter((d) => d.name.toLowerCase().includes(q));
  }, [docs, activeId, query]);

  // —— 文件夹 CRUD ——
  const createFolder = () => {
    const raw = window.prompt("新建文件夹名称", "未命名文件夹");
    const name = raw?.trim();
    if (!name) return;
    const folder = createKnowledgeFolder(name);
    setFolders((prev) => [...prev, folder]);
    showToast(`已新建文件夹「${name}」`, "info");
    apiFetch("/knowledge-base/folders", { method: "POST", body: JSON.stringify({ name }) }).catch(() => undefined);
  };
  const renameFolder = (f: KnowledgeFolder) => {
    const raw = window.prompt("重命名文件夹", f.name);
    const name = raw?.trim();
    if (!name || name === f.name) return;
    setFolders((prev) => prev.map((x) => (x.id === f.id ? { ...x, name } : x)));
    apiFetch(`/knowledge-base/folders/${f.id}`, { method: "PATCH", body: JSON.stringify({ name }) }).catch(() => undefined);
  };
  const deleteFolder = (f: KnowledgeFolder) => {
    const n = folderCount(f.id);
    const msg = n > 0 ? `删除文件夹「${f.name}」？其中 ${n} 个文档将移至「未分类」。` : `删除文件夹「${f.name}」？`;
    if (!window.confirm(msg)) return;
    setFolders((prev) => prev.filter((x) => x.id !== f.id));
    setDocs((prev) => prev.map((d) => (d.folderId === f.id ? { ...d, folderId: KNOWLEDGE_ROOT_FOLDER_ID } : d)));
    if (activeId === f.id) setActiveId(ALL_DOCS_ID);
    apiFetch(`/knowledge-base/folders/${f.id}`, { method: "DELETE" }).catch(() => undefined);
    showToast("已删除文件夹", "info");
  };

  // —— 文档 CRUD ——
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const target = resolveTarget(activeId);
    const created: KnowledgeDoc[] = Array.from(files).map((f) =>
      createKnowledgeDoc({
        name: f.name,
        folderId: target,
        source: "upload",
        size: f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`,
      }),
    );
    const ids = new Set(created.map((d) => d.id));
    setDocs((prev) => [...created, ...prev]);
    showToast(`已开始向量化 ${created.length} 个文档`, "info");
    apiFetch("/knowledge-base/docs", { method: "POST", body: JSON.stringify({ names: created.map((d) => d.name), folderId: target, source: "upload" }) }).catch(() => undefined);
    window.setTimeout(() => {
      setDocs((prev) => prev.map((d) => (ids.has(d.id) ? { ...d, status: "ready", chunks: Math.max(8, Math.round((d.name.length || 8) * 1.5)) } : d)));
    }, 1200);
  };
  const createLink = () => {
    const url = window.prompt("粘贴网页链接");
    if (!url) return;
    const guess = url.split("/").filter(Boolean).pop() || url;
    const name = window.prompt("为该链接命名", guess) || guess;
    const target = resolveTarget(activeId);
    const doc = createKnowledgeDoc({ name, folderId: target, source: "link" });
    setDocs((prev) => [doc, ...prev]);
    apiFetch("/knowledge-base/docs", { method: "POST", body: JSON.stringify({ name, url, folderId: target, source: "link" }) }).catch(() => undefined);
    window.setTimeout(() => {
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: "ready", chunks: Math.max(8, Math.round(name.length * 1.5)) } : d)));
    }, 1200);
  };
  const renameDoc = (d: KnowledgeDoc) => {
    const raw = window.prompt("重命名文档", d.name);
    const name = raw?.trim();
    if (!name || name === d.name) return;
    setDocs((prev) => prev.map((x) => (x.id === d.id ? { ...x, name } : x)));
    apiFetch(`/knowledge-base/docs/${d.id}`, { method: "PATCH", body: JSON.stringify({ name }) }).catch(() => undefined);
  };
  const moveDoc = (d: KnowledgeDoc, target: string) => {
    setDocs((prev) => prev.map((x) => (x.id === d.id ? { ...x, folderId: target } : x)));
    setOpenMenu(null);
    setMoveFor(null);
    apiFetch(`/knowledge-base/docs/${d.id}`, { method: "PATCH", body: JSON.stringify({ folderId: target }) }).catch(() => undefined);
    showToast("已移动", "info");
  };
  const deleteDoc = (d: KnowledgeDoc) => {
    if (!window.confirm(`删除文档「${d.name}」？此操作不可撤销。`)) return;
    setDocs((prev) => prev.filter((x) => x.id !== d.id));
    apiFetch(`/knowledge-base/docs/${d.id}`, { method: "DELETE" }).catch(() => undefined);
    showToast("已删除文档", "info");
  };

  return (
    <AppShell>
      <div className="scrollbar-hide bg-homepage flex-1 overflow-auto">
        <div className="mx-auto max-w-[1200px] px-6 py-6 pb-16">
          {/* Header */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-[22px] font-bold text-[var(--brand-brand01-black)]">
                <BookOpen className="h-5 w-5 text-[var(--brand-brand03-blue)]" strokeWidth={2} />
                知识库
              </h1>
              <p className="mt-1 text-[13px] text-[var(--text-icon-text-4)]">
                为智能体挂载的参考资料；上传 / 链接文档后自动向量化并在对话中引用
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-56 max-w-full">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-icon-text-4)]" strokeWidth={2} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索文档…"
                  className="h-9 w-full rounded-lg border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] pl-8 pr-3 text-[13px] outline-none backdrop-blur-[12px] transition-colors placeholder:text-[var(--text-icon-text-5)] focus:border-[var(--brand-brand03-blue)]"
                />
              </div>
              <button
                type="button"
                onClick={createLink}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--neutral-grey300)] bg-white px-3 text-[13px] text-[var(--text-icon-text-2)] transition-colors hover:bg-[var(--neutral-grey60)] active:scale-[0.96]"
              >
                <Link2 className="h-4 w-4" strokeWidth={1.75} /> 新建链接
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--brand-brand01-black)] px-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.96]"
              >
                <Upload className="h-4 w-4" strokeWidth={2} /> 上传文档
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[220px_1fr]">
            {/* 文件夹树 */}
            <aside className="rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] p-2 shadow-[var(--shadow-card)] backdrop-blur-[18px] saturate-150">
              <button
                type="button"
                onClick={() => setActiveId(ALL_DOCS_ID)}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
                  activeId === ALL_DOCS_ID
                    ? "bg-[var(--neutral-grey100)] font-medium text-[var(--brand-brand01-black)]"
                    : "text-[var(--text-icon-text-2)] hover:bg-[var(--neutral-grey60)]"
                }`}
              >
                <FolderOpen className="h-4 w-4 text-[var(--brand-brand03-blue)]" strokeWidth={1.75} />
                <span className="flex-1">全部文档</span>
                <span className="tabular-nums text-[11px] text-[var(--text-icon-text-5)]">{docs.length}</span>
              </button>
              <div className="my-1 border-t border-[var(--neutral-grey100)]" />
              {folders.map((f) => (
                <div key={f.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveId(f.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 pr-8 text-left text-[13px] transition-colors ${
                      activeId === f.id
                        ? "bg-[var(--neutral-grey100)] font-medium text-[var(--brand-brand01-black)]"
                        : "text-[var(--text-icon-text-2)] hover:bg-[var(--neutral-grey60)]"
                    }`}
                  >
                    <Folder className="h-4 w-4 text-[var(--text-icon-text-4)]" strokeWidth={1.75} />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="tabular-nums text-[11px] text-[var(--text-icon-text-5)]">{folderCount(f.id)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenu(openMenu?.id === f.id ? null : { kind: "folder", id: f.id });
                    }}
                    aria-label="文件夹操作"
                    className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[var(--text-icon-text-4)] hover:bg-[var(--neutral-grey100)]"
                  >
                    <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                  </button>
                  {openMenu?.kind === "folder" && openMenu.id === f.id && (
                    <div
                      className="glass-strong absolute right-1 top-9 z-50 w-40 overflow-hidden rounded-xl py-1 shadow-[var(--shadow-glass)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MenuRow icon={Pencil} label="重命名" onClick={() => { setOpenMenu(null); renameFolder(f); }} />
                      <MenuRow icon={Trash2} label="删除" danger onClick={() => { setOpenMenu(null); deleteFolder(f); }} />
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={createFolder}
                className="mt-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-[var(--neutral-grey300)] px-2.5 py-2 text-left text-[13px] text-[var(--text-icon-text-3)] transition-colors hover:bg-[var(--neutral-grey60)]"
              >
                <Plus className="h-4 w-4" strokeWidth={1.75} /> 新建文件夹
              </button>
            </aside>

            {/* 文档列表 */}
            <div className="rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] shadow-[var(--shadow-card)] backdrop-blur-[18px] saturate-150">
              {visibleDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-[var(--text-icon-text-4)]">
                  <FileText className="h-9 w-9" strokeWidth={1.5} />
                  <p className="text-[14px] font-medium text-[var(--text-icon-text-2)]">暂无文档</p>
                  <p className="text-[12px]">点击右上角「上传文档」或「新建链接」开始</p>
                </div>
              ) : (
                <div>
                  {visibleDocs.map((d, idx) => {
                    const src = SOURCE_META[d.source];
                    const SrcIcon = src.icon;
                    const st = STATUS_LABELS[d.status];
                    const folderName = folders.find((f) => f.id === d.folderId)?.name ?? "未分类";
                    return (
                      <div
                        key={d.id}
                        className={`group relative flex items-center gap-3 px-4 py-3 ${idx > 0 ? "border-t border-[var(--neutral-grey100)]" : ""}`}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--neutral-grey60)] text-[var(--text-icon-text-3)]">
                          <SrcIcon className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[13px] font-medium text-[var(--brand-brand01-black)]">{d.name}</p>
                            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${st.cls}`}>
                              <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${st.dot}`} />
                              {st.label}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[var(--text-icon-text-5)]">
                            <span>{src.label}</span>
                            {d.size && (
                              <>
                                <span>·</span>
                                <span>{d.size}</span>
                              </>
                            )}
                            <span>·</span>
                            <span className="tabular-nums">{d.updatedAt}</span>
                            <span>·</span>
                            <span>{folderName}</span>
                            {typeof d.chunks === "number" && d.chunks > 0 && (
                              <>
                                <span>·</span>
                                <span className="tabular-nums">{d.chunks} 块</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenu(openMenu?.id === d.id ? null : { kind: "doc", id: d.id });
                              setMoveFor(null);
                            }}
                            aria-label="文档操作"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-icon-text-4)] opacity-0 transition-opacity hover:bg-[var(--neutral-grey100)] group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                          </button>
                          {openMenu?.kind === "doc" && openMenu.id === d.id && (
                            <div
                              className="glass-strong absolute right-0 top-8 z-50 max-h-[60vh] w-48 overflow-y-auto rounded-xl py-1 shadow-[var(--shadow-glass)]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MenuRow icon={Pencil} label="重命名" onClick={() => { setOpenMenu(null); renameDoc(d); }} />
                              <div>
                                <button
                                  type="button"
                                  onClick={() => setMoveFor(moveFor === d.id ? null : d.id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--text-icon-text-2)] transition-colors hover:bg-[var(--neutral-grey60)]"
                                >
                                  <FolderInput className="h-4 w-4" strokeWidth={1.75} /> 移动到
                                  <ChevronRight className="ml-auto h-3 w-3" strokeWidth={2} />
                                </button>
                                {moveFor === d.id && (
                                  <div className="max-h-40 overflow-y-auto border-t border-[var(--neutral-grey100)] py-1">
                                    {folders.map((f) => (
                                      <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => moveDoc(d, f.id)}
                                        className="flex w-full items-center gap-1.5 px-7 py-1.5 text-left text-[12px] text-[var(--text-icon-text-3)] transition-colors hover:bg-[var(--neutral-grey60)] hover:text-[var(--text-icon-text-1)]"
                                      >
                                        {d.folderId === f.id && <Check className="h-3 w-3" strokeWidth={2.5} />}
                                        <span className="truncate">{f.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="my-1 border-t border-[var(--neutral-grey100)]" />
                              <MenuRow icon={Trash2} label="删除" danger onClick={() => { setOpenMenu(null); deleteDoc(d); }} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function MenuRow({
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
