"use client";

import { X, Trash2 } from "lucide-react";
import type { Edge, Node } from "@xyflow/react";

import { categoryMeta } from "@/lib/agents";
import type { PortSpec, WorkflowAgentNodeData, WorkflowEdge } from "@/types";
import { cn } from "@/lib/utils";

interface AgentDrawerData extends WorkflowAgentNodeData {
  /** 拓扑运行时高亮标志（瞬态，由画布注入）。 */
  running?: boolean;
}

export interface NodeConfigDrawerProps {
  /** 当前选中的节点（仅 agent 类型显示）。 */
  node: Node;
  /** 全画布连线（用于变量拾取下拉：列出可达上游节点 outputs）。 */
  edges?: Edge[] | WorkflowEdge[];
  /** 全画布节点（用于解析上游 nodeId → 节点 title 显示）。 */
  nodes?: Node[];
  /** 关闭抽屉。 */
  onClose: () => void;
  /** 从画布移除节点。 */
  onRemove: (id: string) => void;
  /** IO 契约变更回调（可选；不传时为只读展示）。 */
  onPortBindingsChange?: (nodeId: string, bindings: Record<string, string>) => void;
}

/**
 * 默认输入/输出端口（向后兼容旧工作流）。
 * 旧节点无 inputs/outputs 声明 → 补一个默认 text 槽，顺序 pipe 语义。
 */
const DEFAULT_INPUTS: PortSpec[] = [{ name: "input", type: "text", label: "输入" }];
const DEFAULT_OUTPUTS: PortSpec[] = [{ name: "output", type: "text", label: "输出" }];

/**
 * 右侧节点配置抽屉 — 选中 agent 节点时滑入。
 *
 * 把原占位"输入主题/输出格式"换成真实 IO 契约编辑（§5.2 P0 #4 + §5.3 typed edge）：
 * - 展示节点声明的 inputs/outputs PortSpec
 * - 每个输入槽可选"自动（上一节点默认输出）"或指定上游 ``nodeId.outputKey``
 *   （变量拾取下拉，来源 = 画布上可达的上游节点 outputs）
 */
export function NodeConfigDrawer({
  node,
  edges,
  nodes,
  onClose,
  onRemove,
}: NodeConfigDrawerProps) {
  const data = node.data as unknown as AgentDrawerData;
  const meta = categoryMeta(data.category);

  const inputs = data.inputs ?? DEFAULT_INPUTS;
  const outputs = data.outputs ?? DEFAULT_OUTPUTS;

  // 计算可达上游节点（画布上有边指向当前节点，递归向上）。
  const upstreamSources = useUpstreamSources(node.id, edges ?? [], nodes ?? []);

  return (
    <aside
      className={cn(
        "flex h-full w-[300px] shrink-0 flex-col border-l border-[var(--neutral-grey200)] bg-white",
        "transition-[transform,opacity] duration-200 ease-out"
      )}
      style={{ transform: "translateX(0)", opacity: 1 }}
    >
      {/* 头部 */}
      <div className="flex h-12 items-center justify-between border-b border-[var(--neutral-grey200)] px-4">
        <span className="text-[13px] font-semibold text-[var(--text-icon-text-1)]">
          节点配置
        </span>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-icon-text-4)] transition-colors hover:bg-[var(--fill-3-hover)] hover:text-[var(--text-icon-text-1)] active:scale-[0.96]"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* 封面 */}
        <div className="relative h-28 w-full overflow-hidden rounded-xl bg-[var(--neutral-grey100)]">
          {data.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.cover}
              alt={data.title}
              className="h-full w-full object-cover"
              style={{ outline: "1px solid rgba(0,0,0,0.08)" }}
            />
          )}
          <div
            className="absolute inset-x-0 bottom-0 h-1"
            style={{ backgroundColor: data.accent }}
          />
        </div>

        {/* 标题 + 类别 */}
        <h3 className="mt-3 text-[15px] font-semibold leading-snug text-[var(--text-icon-text-1)]">
          {data.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: data.accent }}
          />
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium leading-none"
            style={{ backgroundColor: `${data.accent}14`, color: data.accent }}
          >
            {meta.label}
          </span>
        </div>

        {/* 能力 */}
        <div className="mt-4">
          <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-icon-text-4)]">
            能力
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-icon-text-2)]">
            {data.capability}
          </p>
        </div>

        {/* IO 契约：输入端口（变量拾取） */}
        <div className="mt-4">
          <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-icon-text-4)]">
            输入契约
          </div>
          <div className="mt-2 space-y-2">
            {inputs.map((port) => (
              <PortBindingRow
                key={port.name}
                port={port}
                upstreamSources={upstreamSources}
              />
            ))}
            {inputs.length === 0 && (
              <p className="text-[11px] text-[var(--text-icon-text-4)]">
                此节点无输入端口（首节点）。
              </p>
            )}
          </div>
        </div>

        {/* IO 契约：输出端口（只读展示） */}
        <div className="mt-4">
          <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-icon-text-4)]">
            输出契约
          </div>
          <div className="mt-2 space-y-1.5">
            {outputs.map((port) => (
              <div
                key={port.name}
                className="flex items-center justify-between rounded-lg border border-[var(--neutral-grey200)] bg-[var(--neutral-grey100)] px-2.5 py-1.5"
              >
                <span className="text-[12px] font-medium text-[var(--text-icon-text-2)]">
                  {port.label ?? port.name}
                </span>
                <span className="rounded bg-[var(--brand-brand03-blue)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--brand-brand03-blue)]">
                  {port.type}
                </span>
              </div>
            ))}
            {outputs.length === 0 && (
              <p className="text-[11px] text-[var(--text-icon-text-4)]">
                此节点无输出端口。
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 底部操作 */}
      <div className="border-t border-[var(--neutral-grey200)] px-4 py-3">
        <button
          onClick={() => onRemove(node.id)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--neutral-grey200)] bg-white py-2 text-[12px] font-medium text-[var(--brand-brand05-magenta)] transition-colors hover:bg-[#fff1f3] active:scale-[0.97]"
        >
          <Trash2 className="h-3.5 w-3.5" />
          从画布移除
        </button>
      </div>
    </aside>
  );
}

// —— 子组件：单个输入端口的变量拾取行 ———————————————————

interface UpstreamSource {
  /** 上游节点 id。 */
  nodeId: string;
  /** 上游节点显示名（title 或 id）。 */
  label: string;
  /** 该上游节点可提供的输出端口列表（变量拾取选项）。 */
  outputs: PortSpec[];
}

interface PortBindingRowProps {
  port: PortSpec;
  upstreamSources: UpstreamSource[];
}

/**
 * 输入端口绑定行：展示端口名 + 类型 + 一个下拉选择数据来源。
 *
 * 来源选项：
 *   - "auto"（默认）：上一节点默认输出（顺序 pipe，向后兼容）
 *   - ``nodeId.outputKey``：精确指定某上游节点的某个 output 端口
 */
function PortBindingRow({ port, upstreamSources }: PortBindingRowProps) {
  const options: { value: string; label: string }[] = [
    { value: "auto", label: "自动 · 上一节点默认输出" },
  ];
  for (const src of upstreamSources) {
    for (const out of src.outputs) {
      options.push({
        value: `${src.nodeId}.${out.name}`,
        label: `${src.label} · ${out.label ?? out.name}（${out.type}）`,
      });
    }
  }

  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-icon-text-3)]">
          {port.label ?? port.name}
          {port.required && <span className="text-[var(--brand-brand05-magenta)]"> *</span>}
        </span>
        <span className="text-[10px] text-[var(--text-icon-text-4)]">{port.type}</span>
      </div>
      <select
        defaultValue="auto"
        disabled={options.length <= 1}
        className={cn(
          "h-8 w-full rounded-lg border border-[var(--neutral-grey200)] bg-white px-2 text-[12px] text-[var(--text-icon-text-2)] outline-none transition-colors",
          "focus:border-[var(--brand-brand03-blue)] focus:ring-1 focus:ring-[var(--brand-brand03-blue)]",
          options.length <= 1 && "cursor-not-allowed bg-[var(--neutral-grey100)] text-[var(--text-icon-text-4)]"
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {options.length <= 1 && (
        <span className="mt-1 block text-[10px] text-[var(--text-icon-text-4)]">
          画布上暂无可达上游节点
        </span>
      )}
    </label>
  );
}

// —— hook：计算当前节点可达上游节点及其 outputs ——————————————

/**
 * 从当前节点出发，沿 edges.source→target 反向 BFS，收集所有可达上游节点。
 * 用于变量拾取下拉：列出上游节点的 outputs PortSpec。
 */
function useUpstreamSources(
  nodeId: string,
  edges: Edge[] | WorkflowEdge[],
  nodes: Node[]
): UpstreamSource[] {
  // 反向邻接：target → [source, ...]
  const reverseAdj = new Map<string, string[]>();
  for (const e of edges) {
    const arr = reverseAdj.get(e.target) ?? [];
    arr.push(e.source);
    reverseAdj.set(e.target, arr);
  }

  const visited = new Set<string>();
  const queue = [nodeId];
  const upstreamIds = new Set<string>();
  while (queue.length > 0) {
    const cur = queue.shift() as string;
    const preds = reverseAdj.get(cur) ?? [];
    for (const p of preds) {
      if (p === nodeId) continue; // 跳过自环
      if (visited.has(p)) continue;
      visited.add(p);
      upstreamIds.add(p);
      queue.push(p);
    }
  }

  // 解析上游节点的 outputs PortSpec
  const out: UpstreamSource[] = [];
  for (const id of upstreamIds) {
    const n = nodes.find((x) => x.id === id);
    if (!n) continue;
    const d = n.data as unknown as Partial<WorkflowAgentNodeData> | undefined;
    const title =
      (d && typeof d.title === "string" && d.title) || id;
    const outputs = (d?.outputs as PortSpec[] | undefined) ?? DEFAULT_OUTPUTS;
    out.push({ nodeId: id, label: title, outputs });
  }
  return out;
}
