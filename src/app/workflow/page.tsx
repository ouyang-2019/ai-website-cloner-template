"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Edge, Node } from "@xyflow/react";
import { ArrowLeft, Plus, Sparkles, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { useNodesState, useEdgesState } from "@xyflow/react";
import { AgentCanvas, makeAgentNode } from "@/components/workflow/agent-canvas";
import { AgentPalette } from "@/components/workflow/agent-palette";
import { NodeConfigDrawer } from "@/components/workflow/node-config-drawer";
import { useCredits } from "@/components/credits/credits-provider";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { WORKFLOW_TEMPLATES, type WorkflowTemplate } from "@/data/workflow-templates";
import type { Workflow, WorkflowNode, WorkflowEdge } from "@/types";

// —— 工具：react-flow Node[] ↔ WorkflowNode[] ————————————————

function toFlowNodes(wfNodes: Workflow["nodes"]): Node[] {
  return wfNodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
  })) as Node[];
}

function toFlowEdges(wfEdges: Workflow["edges"]): Edge[] {
  return wfEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: true,
    style: { stroke: "#3F4654", strokeWidth: 1.5 },
  }));
}

/** 空白工作流的初始节点：start → end。 */
function emptyWorkflowNodes(): WorkflowNode[] {
  return [
    { id: "start", type: "start", position: { x: 0, y: 120 }, data: { label: "开始" } },
    { id: "end", type: "end", position: { x: 360, y: 120 }, data: { label: "结束" } },
  ];
}
function emptyWorkflowEdges(): WorkflowEdge[] {
  return [{ id: "e-start-end", source: "start", target: "end" }];
}

/** 深拷贝模板节点/连线，避免编辑时污染模板常量。 */
function cloneTemplate(tpl: WorkflowTemplate): Workflow {
  return {
    id: `${tpl.id}-${Date.now()}`,
    name: tpl.name,
    updatedAt: "刚刚",
    nodes: tpl.nodes.map((n) => ({ ...n, data: { ...n.data } })),
    edges: tpl.edges.map((e) => ({ ...e })),
  };
}

function blankWorkflow(): Workflow {
  return {
    id: `wf-blank-${Date.now()}`,
    name: "未命名工作流",
    updatedAt: "刚刚",
    nodes: emptyWorkflowNodes(),
    edges: emptyWorkflowEdges(),
  };
}

// —— localStorage 扫描：读取已保存的工作流 ————————————————

interface SavedWorkflowSummary {
  id: string;
  name: string;
  updatedAt?: string;
  nodeCount: number;
}

function readSavedSummaries(): SavedWorkflowSummary[] {
  if (typeof window === "undefined") return [];
  const out: SavedWorkflowSummary[] = [];
  // 先尽力拉后端列表（失败则回落到 localStorage 扫描）。
  // 此处不阻塞：由调用方异步处理。
  try {
    const keys = Object.keys(window.localStorage).filter((k) => k.startsWith("aubeau_workflow_"));
    for (const k of keys) {
      const raw = window.localStorage.getItem(k);
      if (!raw) continue;
      try {
        const wf = JSON.parse(raw) as Workflow;
        out.push({
          id: wf.id,
          name: wf.name,
          updatedAt: wf.updatedAt,
          nodeCount: wf.nodes?.length ?? 0,
        });
      } catch {
        // 脏数据跳过。
      }
    }
  } catch {
    // 隐私模式 / localStorage 禁用。
  }
  return out;
}

function readSavedWorkflow(id: string): Workflow | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`aubeau_workflow_${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as Workflow;
  } catch {
    return null;
  }
}

// —— 落地页 ————————————————————————————————

function WorkflowLanding({
  onPickTemplate,
  onPickBlank,
  onOpenSaved,
}: {
  onPickTemplate: (tpl: WorkflowTemplate) => void;
  onPickBlank: () => void;
  onOpenSaved: (wf: Workflow) => void;
}) {
  // 初始值直接从 localStorage 扫描（避免在 effect 内同步 setState）。
  const [saved, setSaved] = useState<SavedWorkflowSummary[]>(() => readSavedSummaries());
  const [now, setNow] = useState(0);

  // best-effort 拉后端列表，与 localStorage 合并。
  useEffect(() => {
    let cancelled = false;
    const local = readSavedSummaries();
    void apiFetch<{ items: Workflow[] } | Workflow[]>("/workflows")
      .then((res) => {
        if (cancelled) return;
        const items = Array.isArray(res) ? res : res.items ?? [];
        const merged = new Map<string, SavedWorkflowSummary>();
        for (const s of local) merged.set(s.id, s);
        for (const wf of items) {
          merged.set(wf.id, {
            id: wf.id,
            name: wf.name,
            updatedAt: wf.updatedAt,
            nodeCount: wf.nodes?.length ?? 0,
          });
        }
        setSaved(Array.from(merged.values()));
      })
      .catch(() => {
        // 后端未就绪：localStorage 列表已在初始值中。
      });
    return () => {
      cancelled = true;
    };
  }, [now]);

  const handleDeleteSaved = useCallback((id: string) => {
    try {
      window.localStorage.removeItem(`aubeau_workflow_${id}`);
    } catch {
      // ignore
    }
    setSaved((cur) => cur.filter((s) => s.id !== id));
    setNow((n) => n + 1);
  }, []);

  const handleOpenSaved = useCallback(
    (id: string) => {
      const wf = readSavedWorkflow(id);
      if (wf) onOpenSaved(wf);
    },
    [onOpenSaved]
  );

  return (
    <div className="bg-homepage h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1180px] px-8 py-10">
        {/* 头部 */}
        <header className="mb-8">
          <h1 className="text-[28px] font-semibold leading-tight text-[var(--text-icon-text-1)]">
            工作流
          </h1>
          <p className="mt-1.5 text-[13px] text-[var(--text-icon-text-3)]">
            把多个智能体编排成可复用的工作流
          </p>
        </header>

        {/* 模板网格 */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--brand-brand03-blue)]" />
            <h2 className="text-[14px] font-semibold text-[var(--text-icon-text-1)]">
              从模板开始
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* 新建空白工作流卡片（首个，虚线边框） */}
            <button
              onClick={onPickBlank}
              className={cn(
                "group flex min-h-[168px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed",
                "border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] p-6 text-center backdrop-blur-[18px] saturate-150",
                "transition-[border-color,background-color,transform] duration-150",
                "hover:border-[var(--brand-brand03-blue)] hover:bg-[var(--glass-bg-strong)] active:scale-[0.97]"
              )}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-brand03-blue)]/10 text-[var(--brand-brand03-blue)] transition-transform duration-150 group-hover:scale-110">
                <Plus className="h-6 w-6" />
              </span>
              <div>
                <div className="text-[14px] font-semibold text-[var(--text-icon-text-1)]">
                  新建空白工作流
                </div>
                <div className="mt-0.5 text-[12px] text-[var(--text-icon-text-4)]">
                  从 start → end 开始自由编排
                </div>
              </div>
            </button>

            {/* 模板列表 */}
            {WORKFLOW_TEMPLATES.map((tpl) => {
              const agentCount = tpl.nodes.filter((n) => n.type === "agent").length;
              return (
                <button
                  key={tpl.id}
                  onClick={() => onPickTemplate(tpl)}
                  className={cn(
                    "group flex min-h-[168px] flex-col justify-between rounded-2xl border bg-[var(--glass-bg)] p-5 text-left backdrop-blur-[18px] saturate-150",
                    "border-[var(--glass-border-subtle)] shadow-[var(--shadow-card)]",
                    "transition-[border-color,box-shadow,transform] duration-150",
                    "hover:border-[var(--brand-brand03-blue)] hover:shadow-[var(--shadow-glass)] active:scale-[0.97]"
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="text-[26px] leading-none">{tpl.emoji ?? "📄"}</span>
                      <span className="tabular-nums rounded-full bg-[var(--fill-3-hover)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-icon-text-3)]">
                        {agentCount} 个智能体
                      </span>
                    </div>
                    <h3 className="mt-3 text-[15px] font-semibold leading-snug text-[var(--text-icon-text-1)]">
                      {tpl.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[var(--text-icon-text-3)]">
                      {tpl.desc}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-icon-text-4)]">
                      点击使用
                    </span>
                    <span className="rounded-lg bg-[var(--brand-brand01-black)] px-2.5 py-1 text-[11px] font-medium text-white transition-transform duration-150 group-hover:scale-[1.03]">
                      使用模板
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 我的工作流 */}
        <section className="mt-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[14px] font-semibold text-[var(--text-icon-text-1)]">
              我的工作流
            </h2>
            <span className="tabular-nums text-[12px] text-[var(--text-icon-text-4)]">
              {saved.length}
            </span>
          </div>
          {saved.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--glass-border-subtle)] bg-[var(--glass-bg-soft)] px-6 py-10 text-center text-[12px] text-[var(--text-icon-text-4)] backdrop-blur-[12px]">
              还没有保存的工作流 — 选一个模板或新建空白工作流开始吧。
            </div>
          ) : (
            <ul className="divide-y divide-[var(--glass-border-subtle)] overflow-hidden rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] backdrop-blur-[18px] saturate-150 shadow-[var(--shadow-card)]">
              {saved.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--fill-3-hover)]"
                >
                  <button
                    onClick={() => handleOpenSaved(s.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--fill-3-hover)] text-[14px]">
                      <Sparkles className="h-4 w-4 text-[var(--text-icon-text-3)]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-1 text-[13px] font-medium text-[var(--text-icon-text-1)]">
                        {s.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--text-icon-text-4)]">
                        <span className="tabular-nums">{s.nodeCount} 节点</span>
                        {s.updatedAt && (
                          <>
                            <span>·</span>
                            <span>{s.updatedAt}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeleteSaved(s.id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--text-icon-text-4)] transition-colors hover:bg-[#fff1f3] hover:text-[var(--brand-brand05-magenta)] active:scale-[0.96]"
                    aria-label="删除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

// —— 编辑器 ————————————————————————————————

interface EditorProps {
  initial: Workflow;
  onBack: () => void;
}

function WorkflowEditor({ initial, onBack }: EditorProps) {
  const [name, setName] = useState(initial.name);
  const [updatedAt, setUpdatedAt] = useState<string>(initial.updatedAt ?? "刚刚");
  const [wfId, setWfId] = useState(initial.id);

  const [nodes, setNodes, onNodesChange] = useNodesState(toFlowNodes(initial.nodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toFlowEdges(initial.edges));
  const [selected, setSelected] = useState<Node | null>(null);
  const [running, setRunning] = useState(false);

  const runTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { showToast } = useCredits();

  useEffect(() => {
    return () => {
      if (runTimer.current) clearTimeout(runTimer.current);
    };
  }, []);

  /** 连线回调 — addEdge 在 AgentCanvas 内部完成。 */
  const handleConnect = useCallback(() => {
    // no-op
  }, []);

  /** 拖放新增 agent 节点。 */
  const handleDropAgent = useCallback(
    (agentId: number, x: number, y: number) => {
      const node = makeAgentNode(agentId, x, y);
      setNodes((ns) => ns.concat(node));
      showToast(`已添加「${(node.data as { title: string }).title}」`, "info");
    },
    [setNodes, showToast]
  );

  /** 删除节点（同时清理相关连线）。 */
  const handleRemove = useCallback(
    (id: string) => {
      setNodes((ns) => ns.filter((n) => n.id !== id));
      setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
      setSelected((cur) => (cur?.id === id ? null : cur));
    },
    [setNodes, setEdges]
  );

  /** 清空画布（保留为最小 start→end）。 */
  const handleClear = useCallback(() => {
    const empty = emptyWorkflowNodes();
    const emptyE = emptyWorkflowEdges();
    setNodes(toFlowNodes(empty));
    setEdges(toFlowEdges(emptyE));
    setSelected(null);
    showToast("画布已重置", "info");
  }, [setNodes, setEdges, showToast]);

  /** 保存：localStorage + best-effort POST /api/workflows。 */
  const handleSave = useCallback(() => {
    const payload: Workflow = {
      id: wfId,
      name,
      updatedAt: new Date().toISOString(),
      nodes: nodes.map((n) => ({
        id: n.id,
        type: (n.type as Workflow["nodes"][number]["type"]) ?? "agent",
        position: n.position,
        data: n.data as Workflow["nodes"][number]["data"],
      })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    };
    try {
      window.localStorage.setItem(`aubeau_workflow_${wfId}`, JSON.stringify(payload));
    } catch {
      // localStorage 禁用时静默。
    }
    setUpdatedAt("刚刚");
    showToast("已保存", "info");
    void apiFetch("/workflows", { method: "POST", body: JSON.stringify(payload) }).catch(() => {
      // 后端未就绪：本地已落地。
    });
  }, [wfId, name, nodes, edges, showToast]);

  /** 运行：拓扑排序后逐个点亮 agent 节点。 */
  const handleRun = useCallback(() => {
    if (running) return;
    const agentNodes = nodes.filter((n) => n.type === "agent");
    if (agentNodes.length === 0) {
      showToast("画布上没有可运行的智能体", "info");
      return;
    }
    const ids = new Set(agentNodes.map((n) => n.id));
    const indeg = new Map<string, number>();
    const adj = new Map<string, string[]>();
    agentNodes.forEach((n) => {
      indeg.set(n.id, 0);
      adj.set(n.id, []);
    });
    edges.forEach((e) => {
      if (ids.has(e.source) && ids.has(e.target)) {
        indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
        adj.get(e.source)?.push(e.target);
      }
    });
    const queue = agentNodes.filter((n) => (indeg.get(n.id) ?? 0) === 0).map((n) => n.id);
    const order: string[] = [];
    const seen = new Set<string>();
    while (queue.length > 0) {
      const id = queue.shift() as string;
      if (seen.has(id)) continue;
      seen.add(id);
      order.push(id);
      for (const next of adj.get(id) ?? []) {
        indeg.set(next, (indeg.get(next) ?? 1) - 1);
        if ((indeg.get(next) ?? 0) <= 0) queue.push(next);
      }
    }
    agentNodes.forEach((n) => {
      if (!seen.has(n.id)) order.push(n.id);
    });

    setRunning(true);
    showToast(`开始运行「${name}」`, "info");

    setNodes((ns) =>
      ns.map((n) =>
        n.data && (n.data as { running?: boolean }).running
          ? { ...n, data: { ...n.data, running: false } }
          : n
      )
    );

    let i = 0;
    const step = () => {
      if (i >= order.length) {
        setNodes((ns) =>
          ns.map((n) =>
            n.data && (n.data as { running?: boolean }).running
              ? { ...n, data: { ...n.data, running: false } }
              : n
          )
        );
        setRunning(false);
        showToast("工件已发布", "info");
        return;
      }
      const activeId = order[i];
      setNodes((ns) =>
        ns.map((n) => (n.id === activeId ? { ...n, data: { ...n.data, running: true } } : n))
      );
      i += 1;
      runTimer.current = setTimeout(step, 700);
    };
    runTimer.current = setTimeout(step, 200);
  }, [running, nodes, edges, name, setNodes, showToast]);

  const handleSelectionChange = useCallback((sel: Node[]) => {
    setSelected(sel[0] ?? null);
  }, []);

  /** 返回：把当前草稿落地到 localStorage（避免误丢），再回到落地页。 */
  const handleBack = useCallback(() => {
    const draft: Workflow = {
      id: wfId,
      name,
      updatedAt: new Date().toISOString(),
      nodes: nodes.map((n) => ({
        id: n.id,
        type: (n.type as Workflow["nodes"][number]["type"]) ?? "agent",
        position: n.position,
        data: n.data as Workflow["nodes"][number]["data"],
      })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    };
    try {
      window.localStorage.setItem(`aubeau_workflow_${wfId}`, JSON.stringify(draft));
    } catch {
      // ignore
    }
    onBack();
  }, [wfId, name, nodes, edges, onBack]);

  const drawerNode = useMemo(
    () => (selected && selected.type === "agent" ? selected : null),
    [selected]
  );

  // 每次切换 initial（模板/空白）时重置工作流 id 与字段。
  useEffect(() => {
    setWfId(initial.id);
    setName(initial.name);
    setUpdatedAt(initial.updatedAt ?? "刚刚");
    setNodes(toFlowNodes(initial.nodes));
    setEdges(toFlowEdges(initial.edges));
    setSelected(null);
    // 仅以 initial.id 为依赖，避免每次 render 重置画布。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--glass-border-subtle)] bg-[var(--glass-bg-strong)] px-4 backdrop-blur-xl saturate-150">
        {/* 左：返回 + 名称 + 保存时间 */}
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={handleBack}
            className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[var(--neutral-grey200)] bg-white px-2.5 text-[12px] font-medium text-[var(--text-icon-text-2)] transition-colors hover:bg-[var(--fill-3-hover)] active:scale-[0.97]"
            aria-label="返回"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0 rounded-md bg-transparent px-1.5 py-1 text-[14px] font-semibold text-[var(--text-icon-text-1)] outline-none transition-colors hover:bg-[var(--fill-3-hover)] focus:bg-[var(--fill-3-hover)] focus:ring-1 focus:ring-[var(--brand-brand03-blue)]"
              aria-label="工作流名称"
              size={Math.max(name.length, 6)}
            />
            <span className="shrink-0 text-[11px] text-[var(--text-icon-text-4)]">
              已保存 · {updatedAt}
            </span>
          </div>
        </div>

        {/* 右：操作按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="h-8 rounded-lg border border-[var(--neutral-grey200)] bg-white px-3 text-[12px] font-medium text-[var(--text-icon-text-2)] transition-colors hover:bg-[var(--fill-3-hover)] active:scale-[0.97]"
          >
            清空
          </button>
          <button
            onClick={handleSave}
            className="h-8 rounded-lg bg-[var(--brand-brand01-black)] px-3 text-[12px] font-medium text-white transition-transform active:scale-[0.97]"
          >
            保存
          </button>
          <button
            onClick={handleRun}
            disabled={running}
            className={cn(
              "h-8 rounded-lg px-4 text-[12px] font-medium text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.97]",
              running && "cursor-not-allowed opacity-60"
            )}
            style={{ backgroundImage: "var(--gradient-brand)", boxShadow: "var(--shadow-glow-emerald)" }}
          >
            {running ? "运行中…" : "运行"}
          </button>
        </div>
      </header>

      {/* 主体：调色板 + 画布 + 配置抽屉 */}
      <div className="flex min-h-0 flex-1">
        <AgentPalette />
        <div className="relative min-w-0 flex-1">
          <AgentCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            setNodes={setNodes}
            setEdges={setEdges}
            onConnect={handleConnect}
            onDropAgent={handleDropAgent}
            onSelectionChange={handleSelectionChange}
          />
        </div>
        {drawerNode && (
          <NodeConfigDrawer
            key={drawerNode.id}
            node={drawerNode}
            onClose={() => setSelected(null)}
            onRemove={handleRemove}
          />
        )}
      </div>
    </div>
  );
}

// —— 页面：落地 ↔ 编辑器 切换 ————————————————

export default function WorkflowPage() {
  // 编辑器初始化工作流（null = 落地页）。
  const [editing, setEditing] = useState<Workflow | null>(null);

  const handlePickTemplate = useCallback((tpl: WorkflowTemplate) => {
    setEditing(cloneTemplate(tpl));
  }, []);

  const handlePickBlank = useCallback(() => {
    setEditing(blankWorkflow());
  }, []);

  const handleOpenSaved = useCallback((wf: Workflow) => {
    // 已保存工作流：深拷贝避免编辑影响 localStorage 中的源对象。
    setEditing({
      ...wf,
      nodes: wf.nodes.map((n) => ({ ...n, data: { ...n.data } })),
      edges: wf.edges.map((e) => ({ ...e })),
    });
  }, []);

  const handleBack = useCallback(() => {
    setEditing(null);
  }, []);

  return (
    <AppShell>
      {editing ? (
        <WorkflowEditor initial={editing} onBack={handleBack} />
      ) : (
        <WorkflowLanding
          onPickTemplate={handlePickTemplate}
          onPickBlank={handlePickBlank}
          onOpenSaved={handleOpenSaved}
        />
      )}
    </AppShell>
  );
}
