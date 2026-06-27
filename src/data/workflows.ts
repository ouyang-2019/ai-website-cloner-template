import type { Workflow } from "@/types";
import { TEMPLATE_CARDS } from "@/data/content";
import { categoryMeta } from "@/lib/agents";

/** 取智能体卡片的封面/类别/强调色，供工作流节点复用。 */
function agentVisual(id: number) {
  const card = TEMPLATE_CARDS[id - 1];
  const meta = categoryMeta(card.category);
  return { title: card.title, cover: card.cover, category: card.category, accent: meta.accent, capability: card.capability };
}

/**
 * 工作流种子 — 后端 `GET /api/workflows` 不可用时回落。
 * "美妆爆品研判流水线"：趋势雷达 → 竞品背调 → 参考配方 → 文案合规。
 */
export const SEED_WORKFLOWS: Workflow[] = [
  {
    id: "wf-content",
    name: "美妆爆品研判流水线",
    updatedAt: "昨天",
    nodes: [
      { id: "start", type: "start", position: { x: -200, y: 40 }, data: { label: "开始 · 输入赛道/产品" } },
      {
        id: "n-trend",
        type: "agent",
        position: { x: 40, y: -80 },
        data: { agentId: 7, ...agentVisual(7) },
      },
      {
        id: "n-competitor",
        type: "agent",
        position: { x: 40, y: 160 },
        data: { agentId: 8, ...agentVisual(8) },
      },
      {
        id: "n-formula",
        type: "agent",
        position: { x: 320, y: 40 },
        data: { agentId: 6, ...agentVisual(6) },
      },
      {
        id: "n-claim",
        type: "agent",
        position: { x: 600, y: 40 },
        data: { agentId: 4, ...agentVisual(4) },
      },
      { id: "end", type: "end", position: { x: 880, y: 40 }, data: { label: "结束 · 发布行业报告" } },
    ],
    edges: [
      { id: "e1", source: "start", target: "n-trend" },
      { id: "e2", source: "start", target: "n-competitor" },
      { id: "e3", source: "n-trend", target: "n-formula" },
      { id: "e4", source: "n-competitor", target: "n-formula" },
      { id: "e5", source: "n-formula", target: "n-claim" },
      { id: "e6", source: "n-claim", target: "end" },
    ],
  },
];
