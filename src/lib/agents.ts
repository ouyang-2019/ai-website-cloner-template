import { TEMPLATE_CARDS, AGENT_CATEGORIES } from "@/data/content";
import type { TemplateCard, AgentCategory, CategoryMeta } from "@/types";
import type { AgentCapability, TaskComplexity } from "@/types/credits";
import { getAgentRunCost, getTaskCost } from "./credits";

/** Stable id → agent card (1-based, matches gallery href). */
export function getAgentById(id: number): TemplateCard | null {
  return TEMPLATE_CARDS[id - 1] ?? null;
}

export const AGENT_COUNT = TEMPLATE_CARDS.length;

/** Fallback capability rotation (used only if a card lacks one). */
const CAPABILITY_ROTATION: AgentCapability[] = [
  "orchestration",
  "tool-call",
  "memory-retrieval",
  "artifact-publish",
  "im-channel",
  "autonomous-trigger",
];

/** Derive a primary capability per agent — prefers the card's real capability. */
export function primaryCapability(id: number): AgentCapability {
  return getAgentById(id)?.capability ?? CAPABILITY_ROTATION[(id - 1) % CAPABILITY_ROTATION.length];
}

/** Category of an agent (null if not found). */
export function categoryOf(id: number): AgentCategory | null {
  return getAgentById(id)?.category ?? null;
}

/** Category metadata (label / icon / accent / blurb). */
export function categoryMeta(cat: AgentCategory): CategoryMeta {
  return AGENT_CATEGORIES.find((c) => c.key === cat) ?? AGENT_CATEGORIES[0];
}

/** All agent ids in a given category (1-based). */
export function agentsByCategory(cat: AgentCategory): number[] {
  const ids: number[] = [];
  TEMPLATE_CARDS.forEach((c, i) => {
    if (c.category === cat) ids.push(i + 1);
  });
  return ids;
}

/** Count of agents per category (for explore filter chips). */
export function categoryCounts(): Record<AgentCategory, number> {
  const out = Object.fromEntries(AGENT_CATEGORIES.map((c) => [c.key, 0])) as Record<AgentCategory, number>;
  TEMPLATE_CARDS.forEach((c) => {
    out[c.category] += 1;
  });
  return out;
}

export interface AgentCapabilityRow {
  capability: AgentCapability;
  complexity: TaskComplexity;
  cost: number;
}

/** Build a capability cost table for an agent (primary row uses the card's real values). */
export function agentCapabilities(id: number): AgentCapabilityRow[] {
  const card = getAgentById(id);
  if (!card) return [];
  const rows: Array<{ capability: AgentCapability; complexity: TaskComplexity }> = [
    { capability: card.capability, complexity: card.complexity },
    { capability: "chat", complexity: "light" },
    { capability: "memory-retrieval", complexity: "light" },
    { capability: "artifact-publish", complexity: "standard" },
  ];
  return rows.map((r, index) => ({
    ...r,
    cost: index === 0 ? getAgentRunCost(card) : getTaskCost(r.capability, r.complexity),
  }));
}

/** Compose a description grounded in the card's real tagline + toolset. */
export function agentDescription(card: TemplateCard): string {
  const meta = categoryMeta(card.category);
  const toolHint = card.tools.length > 0 ? `调用 ${card.tools.length} 个真实工具（如 ${card.tools[0]}）` : "纯编排能力";
  return `${card.tagline}。属「${meta.label}」类，${toolHint}，基于 AUBEAU 编排引擎自动完成多步任务，结果以工件发布或经 IM 渠道触达，全程按量计费、可自主触发。`;
}

/** Mock example conversation for the detail page (uses the real tagline). */
export function agentExampleDialogue(card: TemplateCard): Array<{ role: "user" | "assistant"; text: string }> {
  return [
    { role: "user", text: `帮我用「${card.title}」处理今天的需求。` },
    {
      role: "assistant",
      text: `好的，已启动「${card.title}」。${card.tagline}。我会依次完成工具调用与记忆检索，结束后通过 IM 渠道通知你并发布工件。`,
    },
    { role: "user", text: "完成后把结果发到工作群。" },
    {
      role: "assistant",
      text: `已收到。工件发布后将自动推送至绑定的 IM 群组，并附上本次运行的积分明细与结果摘要。`,
    },
  ];
}

/** Related agents — prefer same category, then fall back to neighbours. */
export function relatedAgents(id: number, n = 4): Array<{ id: number; card: TemplateCard }> {
  const card = getAgentById(id);
  const seen = new Set<number>([id]);
  const out: Array<{ id: number; card: TemplateCard }> = [];

  // 1) same-category siblings first
  if (card) {
    for (const rid of agentsByCategory(card.category)) {
      if (out.length >= n) break;
      if (seen.has(rid)) continue;
      const c = getAgentById(rid);
      if (c) {
        out.push({ id: rid, card: c });
        seen.add(rid);
      }
    }
  }
  // 2) fall back to neighbours by rotation
  for (let i = 1; out.length < n && i <= AGENT_COUNT; i++) {
    const rid = ((id - 1 + i) % AGENT_COUNT) + 1;
    if (seen.has(rid)) continue;
    const c = getAgentById(rid);
    if (c) {
      out.push({ id: rid, card: c });
      seen.add(rid);
    }
  }
  return out;
}
