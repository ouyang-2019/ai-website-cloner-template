"use client";

import { useCallback, useMemo, type CSSProperties, type DragEvent } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Handle,
  Position,
  ConnectionLineType,
  MarkerType,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TEMPLATE_CARDS } from "@/data/content";
import { categoryMeta } from "@/lib/agents";
import type { WorkflowAgentNodeData, AgentCategory } from "@/types";
import { cn } from "@/lib/utils";

/** 反应流节点 data 与我们的 WorkflowAgentNodeData 并集（外加运行态/标签）。 */
type AgentNodeData = WorkflowAgentNodeData & {
  /** 拓扑运行时高亮标志（瞬态）。 */
  running?: boolean;
};

type SimpleNodeData = { label?: string; running?: boolean };

// —— 自定义节点 ——————————————————————————————

/** 智能体节点 — 深色舞台上的卡片：封面 + 标题 + 能力 chip（ 风格）。 */
function AgentNode({ data, selected }: NodeProps) {
  const d = data as unknown as AgentNodeData;
  const accent = d.accent || "#6E8BFF";
  return (
    <div
      className={cn(
        "group relative w-[208px] overflow-hidden rounded-[14px] border bg-[#171A21]",
        "shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition-[box-shadow,border-color,transform] duration-150",
        selected
          ? "border-[1.5px]"
          : "border-[#2A2F38] hover:border-[#3A4150] hover:shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
      )}
      style={
        selected
          ? { borderColor: accent, boxShadow: `0 0 0 3px ${accent}33, 0 8px 30px rgba(0,0,0,0.45)` }
          : undefined
      }
    >
      {/* 运行态：accent 脉冲外环 */}
      {d.running && (
        <div
          className="pointer-events-none absolute -inset-[3px] animate-pulse rounded-[16px] ring-2"
          style={
            {
              // Tailwind v4：通过 CSS 变量驱动 ring 颜色
              "--tw-ring-color": accent,
              boxShadow: `0 0 0 4px ${accent}22`,
            } as CSSProperties
          }
        />
      )}
      {/* 封面 */}
      <div className="relative h-[56px] w-full overflow-hidden bg-[#222631]">
        {d.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={d.cover}
            alt={d.title}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: `linear-gradient(135deg, ${accent}40, ${accent}10)` }}
          />
        )}
        {/* 封面底部的 accent 细线 */}
        <div
          className="absolute inset-x-0 bottom-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, ${accent}, ${accent}00)` }}
        />
        {/* 运行态脉冲点 */}
        {d.running && (
          <span
            className="absolute right-2 top-2 h-2 w-2 animate-ping rounded-full"
            style={{ backgroundColor: accent }}
          />
        )}
      </div>
      {/* 标题 */}
      <div className="px-3 pt-2.5">
        <div className="line-clamp-1 text-[13px] font-semibold leading-tight text-[#F5F7FA]">
          {d.title}
        </div>
      </div>
      {/* 能力 chip */}
      <div className="flex items-center gap-1.5 px-3 pb-3 pt-1.5">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          {d.capability}
        </span>
      </div>

      {/* 左右连接手柄 */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-[#171A21] !bg-[#5B6273] transition-colors hover:!bg-[#6E8BFF]"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-[#171A21] !bg-[#5B6273] transition-colors hover:!bg-[#6E8BFF]"
      />
    </div>
  );
}

/** 开始节点 — 深色胶囊型，青绿强调（ 终端节点）。 */
function StartNode({ data, selected }: NodeProps) {
  const d = data as unknown as SimpleNodeData;
  const accent = "#2DD4BF";
  return (
    <div
      className={cn(
        "relative flex h-9 items-center gap-1.5 rounded-full border px-4",
        "bg-[#171A21] shadow-[0_6px_20px_rgba(0,0,0,0.4)] transition-[box-shadow,transform,border-color] duration-150 active:scale-[0.96]",
        selected ? "border-[1.5px]" : "border-[#2A2F38] hover:border-[#3A4150]"
      )}
      style={
        selected
          ? { borderColor: accent, boxShadow: `0 0 0 3px ${accent}33, 0 6px 20px rgba(0,0,0,0.4)` }
          : undefined
      }
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{
          backgroundColor: accent,
          boxShadow: d.running ? `0 0 0 4px ${accent}33` : `0 0 6px ${accent}99`,
        }}
      />
      <span className="text-[12px] font-semibold text-[#F5F7FA]">
        {d.label || "开始"}
      </span>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-[#171A21]"
        style={{ backgroundColor: accent }}
      />
    </div>
  );
}

/** 结束节点 — 深色胶囊型，玫红强调（ 终端节点）。 */
function EndNode({ data, selected }: NodeProps) {
  const d = data as unknown as SimpleNodeData;
  const accent = "#FB7185";
  return (
    <div
      className={cn(
        "relative flex h-9 items-center gap-1.5 rounded-full border px-4",
        "bg-[#171A21] shadow-[0_6px_20px_rgba(0,0,0,0.4)] transition-[box-shadow,transform,border-color] duration-150 active:scale-[0.96]",
        selected ? "border-[1.5px]" : "border-[#2A2F38] hover:border-[#3A4150]"
      )}
      style={
        selected
          ? { borderColor: accent, boxShadow: `0 0 0 3px ${accent}33, 0 6px 20px rgba(0,0,0,0.4)` }
          : undefined
      }
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-[#171A21]"
        style={{ backgroundColor: accent }}
      />
      <span
        className="h-2 w-2 rounded-full"
        style={{
          backgroundColor: accent,
          boxShadow: d.running ? `0 0 0 4px ${accent}33` : `0 0 6px ${accent}99`,
        }}
      />
      <span className="text-[12px] font-semibold text-[#F5F7FA]">
        {d.label || "结束"}
      </span>
    </div>
  );
}

// —— 画布主体 ——————————————————————————————

export interface AgentCanvasProps {
  /** 初始节点（来自父组件状态）。 */
  nodes: Node[];
  /** 初始连线。 */
  edges: Edge[];
  /** 选中节点变化。 */
  onNodesChange: ReturnType<typeof useNodesState>[2];
  onEdgesChange: ReturnType<typeof useEdgesState>[2];
  /** 设置节点（用于 onConnect / onDrop / 运行高亮）。 */
  setNodes: ReturnType<typeof useNodesState>[1];
  setEdges: ReturnType<typeof useEdgesState>[1];
  /** 连线回调。 */
  onConnect: (c: Connection) => void;
  /** 拖放新增节点回调。 */
  onDropAgent: (agentId: number, x: number, y: number) => void;
  /** 选中变化。 */
  onSelectionChange?: (nodes: Node[]) => void;
}

function CanvasInner(props: AgentCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, setEdges, onConnect, onDropAgent, onSelectionChange } = props;
  const flow = useReactFlow();

  // nodeTypes 必须稳定引用（react-flow 警告）。
  const nodeTypes = useMemo<NodeTypes>(
    () => ({ agent: AgentNode, start: StartNode, end: EndNode }),
    []
  );

  const handleConnect = useCallback(
    (c: Connection) => {
      onConnect(c);
      setEdges((e: Edge[]) => addEdge({ ...c, animated: true }, e));
    },
    [onConnect, setEdges]
  );

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/agent-id");
      const agentId = Number(raw);
      if (!agentId || Number.isNaN(agentId)) return;
      const pos = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      onDropAgent(agentId, pos.x, pos.y);
    },
    [onDropAgent, flow]
  );

  return (
    <div className="relative h-full w-full bg-[#0E1116]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onSelectionChange={({ nodes: sel }) => onSelectionChange?.(sel)}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          animated: true,
          type: "default",
          style: { stroke: "#3F4654", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#3F4654", width: 16, height: 16 },
        }}
        connectionLineType={ConnectionLineType.Bezier}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#232833" />
        <Controls
          position="bottom-left"
          showInteractive={false}
          className="!overflow-hidden !rounded-[10px] !border !border-[#22272F] !bg-[#171A21] !shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
        />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          maskColor="rgba(14,17,22,0.7)"
          className="!overflow-hidden !rounded-[10px] !border !border-[#22272F] !bg-[#11141A]"
          nodeColor={(node) => {
            const data = node.data as unknown as AgentNodeData | SimpleNodeData;
            if ("accent" in data && data.accent) return data.accent;
            if (node.type === "start") return "#2DD4BF";
            if (node.type === "end") return "#FB7185";
            return "#3F4654";
          }}
          nodeStrokeColor="#0E1116"
          nodeStrokeWidth={2}
        />
      </ReactFlow>
    </div>
  );
}

/** 暴露：用 ReactFlowProvider 包裹，使内部能用 useReactFlow / screenToFlowPosition。 */
export function AgentCanvas(props: AgentCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}

// —— 工厂：构造新的 agent 节点（供父组件在 onDropAgent 时调用） ——

/** 节点 id 自增计数（避免 crypto.randomUUID 的 SSR 不一致）。 */
const idCounter = { n: 0 };

export function makeAgentNode(agentId: number, x: number, y: number): Node {
  const card = TEMPLATE_CARDS[agentId - 1];
  const meta = categoryMeta((card?.category ?? "doc") as AgentCategory);
  idCounter.n += 1;
  return {
    id: `n-${agentId}-${idCounter.n}`,
    type: "agent",
    position: { x, y },
    data: {
      agentId,
      title: card?.title ?? "智能体",
      cover: card?.cover ?? "",
      category: card?.category ?? "doc",
      accent: meta.accent,
      capability: card?.capability ?? "orchestration",
    } satisfies AgentNodeData,
  };
}
