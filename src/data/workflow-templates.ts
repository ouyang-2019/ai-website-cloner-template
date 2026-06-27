import type { WorkflowNode, WorkflowEdge, AgentCategory } from "@/types";
import { TEMPLATE_CARDS } from "@/data/content";
import { categoryMeta } from "@/lib/agents";
import { SEED_WORKFLOWS } from "@/data/workflows";

/** 取智能体卡片的封面/类别/强调色，供节点 data 复用。 */
function agentVisual(id: number) {
  const card = TEMPLATE_CARDS[id - 1];
  const meta = categoryMeta(card.category as AgentCategory);
  return {
    agentId: id,
    title: card.title,
    cover: card.cover,
    category: card.category,
    accent: meta.accent,
    capability: card.capability,
  };
}

export interface WorkflowTemplate {
  /** 模板标识（同时也是新建工作流的 id 前缀来源）。 */
  id: string;
  /** 模板名称。 */
  name: string;
  /** 一句话描述。 */
  desc: string;
  /** 可选的 emoji 前缀。 */
  emoji?: string;
  /** 模板节点（start / agent / end）。 */
  nodes: WorkflowNode[];
  /** 模板连线。 */
  edges: WorkflowEdge[];
}

/**
 * 工作流模板列表 — 落地页展示 + 编辑器初始化用。
 * 第 1 个沿用 SEED_WORKFLOWS[0]（"内容生产流水线"）以确保与既有种子一致；
 * 其余为追加的小型 start → 1-3 agent → end 编排。
 */
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "tpl-content",
    name: SEED_WORKFLOWS[0].name,
    desc: "趋势报告与竞品背调并行，汇入参考配方和文案合规复核。",
    emoji: "💄",
    nodes: SEED_WORKFLOWS[0].nodes.map((n) => ({ ...n, data: { ...n.data } })),
    edges: SEED_WORKFLOWS[0].edges.map((e) => ({ ...e })),
  },
  {
    id: "tpl-followup",
    name: "配方审核到安评",
    desc: "配方审核 → 原料合规 → 安评报告，形成备案前核心审查链路。",
    emoji: "🧪",
    nodes: [
      { id: "start", type: "start", position: { x: -200, y: 80 }, data: { label: "开始 · 上传配方" } },
      { id: "n-review", type: "agent", position: { x: 40, y: 0 }, data: agentVisual(1) },
      { id: "n-ingredient", type: "agent", position: { x: 320, y: 0 }, data: agentVisual(3) },
      { id: "n-safety", type: "agent", position: { x: 600, y: 0 }, data: agentVisual(2) },
      { id: "end", type: "end", position: { x: 880, y: 80 }, data: { label: "结束 · 安评工件" } },
    ],
    edges: [
      { id: "e1", source: "start", target: "n-review" },
      { id: "e2", source: "n-review", target: "n-ingredient" },
      { id: "e3", source: "n-ingredient", target: "n-safety" },
      { id: "e4", source: "n-safety", target: "end" },
    ],
  },
  {
    id: "tpl-weekly",
    name: "爆品趋势日报",
    desc: "趋势雷达 → 竞品背调 → 文案合规，生成可复核的行业日报。",
    emoji: "📊",
    nodes: [
      { id: "start", type: "start", position: { x: -200, y: 60 }, data: { label: "开始 · 赛道关键词" } },
      { id: "n-trend", type: "agent", position: { x: 40, y: -40 }, data: agentVisual(7) },
      { id: "n-competitor", type: "agent", position: { x: 40, y: 120 }, data: agentVisual(8) },
      { id: "n-claim", type: "agent", position: { x: 320, y: 40 }, data: agentVisual(4) },
      { id: "n-artwork", type: "agent", position: { x: 600, y: 40 }, data: agentVisual(5) },
      { id: "end", type: "end", position: { x: 880, y: 60 }, data: { label: "结束 · 日报归档" } },
    ],
    edges: [
      { id: "e1", source: "start", target: "n-trend" },
      { id: "e2", source: "start", target: "n-competitor" },
      { id: "e3", source: "n-trend", target: "n-claim" },
      { id: "e4", source: "n-competitor", target: "n-claim" },
      { id: "e5", source: "n-claim", target: "n-artwork" },
      { id: "e6", source: "n-artwork", target: "end" },
    ],
  },
  {
    id: "tpl-marketing",
    name: "上市稿件合规复核",
    desc: "参考配方 → 文案合规 → 稿件一致性，控制上市资料风险。",
    emoji: "🛡️",
    nodes: [
      { id: "start", type: "start", position: { x: -200, y: 80 }, data: { label: "开始 · 上市资料" } },
      { id: "n-formula", type: "agent", position: { x: 40, y: 0 }, data: agentVisual(6) },
      { id: "n-claim", type: "agent", position: { x: 320, y: -80 }, data: agentVisual(4) },
      { id: "n-artwork", type: "agent", position: { x: 320, y: 100 }, data: agentVisual(5) },
      { id: "n-safety", type: "agent", position: { x: 600, y: 0 }, data: agentVisual(2) },
      { id: "end", type: "end", position: { x: 880, y: 80 }, data: { label: "结束 · 风险清单" } },
    ],
    edges: [
      { id: "e1", source: "start", target: "n-formula" },
      { id: "e2", source: "n-formula", target: "n-claim" },
      { id: "e3", source: "n-formula", target: "n-artwork" },
      { id: "e4", source: "n-claim", target: "n-safety" },
      { id: "e5", source: "n-artwork", target: "n-safety" },
      { id: "e6", source: "n-safety", target: "end" },
    ],
  },
];
