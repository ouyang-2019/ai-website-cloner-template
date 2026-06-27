import type { TemplateCard, CategoryMeta } from "@/types";
import type { AgentCapability } from "@/types/credits";
import { categoryMeta, relatedAgents } from "./agents";

/**
 * 案例智能体展示页专用派生层 —— 把「费用/积分」语义彻底从介绍页剥离，
 * 只保留展示所需：真实案例图、工作原理、互动种子数、可复制配置。
 * 与 lib/agents.ts 的目录/能力查询职责分离（SRP）。
 */

/** 补零编号，用于截图文件名与 URL 约定。 */
export const pad2 = (n: number) => String(n).padStart(2, "0");

/** 真实驱动截图路径（由 scripts/capture-agents.mjs 逐个跑出并落盘）。 */
export const agentShowcaseImage = (id: number) =>
  `/images/agent-showcase/agent-${pad2(id)}.png`;

/** 工作原理 3 步 —— 按主能力给出真实可读的执行链路。 */
const HOW_IT_WORKS: Record<AgentCapability, string[]> = {
  orchestration: ["拆解任务并分发子步骤", "并行执行与中间校验", "整合产物并发布工件"],
  "tool-call": ["理解输入与参数约束", "依次调用真实工具链", "校验并结构化输出"],
  "memory-retrieval": ["提取关键问题与实体", "多源检索与交叉验证", "综合证据给出结论"],
  "artifact-publish": ["梳理内容与版式风格", "生成可独立交付的工件", "发布并附溯源元数据"],
  "im-channel": ["解析触发条件与对象", "经审批后外发触达", "回写结果与状态"],
  "autonomous-trigger": ["设定触发计划与频次", "到点自主执行任务", "异常告警与自动回滚"],
  chat: ["理解你的真实意图", "给出简洁可用的答复", "不确定时主动澄清"],
};

export function agentHowItWorks(capability: AgentCapability): string[] {
  return HOW_IT_WORKS[capability] ?? HOW_IT_WORKS.chat;
}

/**
 * 互动种子数 —— 仅用于首次展示，确定性派生（不引入随机），
 * 用户点击增量由 agent-engagement-bar 叠加并持久化到 localStorage。
 */
export function agentEngagementSeed(id: number): {
  views: number;
  likes: number;
  shares: number;
} {
  // 简单确定性散列，保证同一智能体每次稳定、不同智能体彼此区分。
  const h = (id * 2654435761) >>> 0;
  const views = 1200 + (h % 48000);
  const likes = Math.round(views * (0.08 + ((h >> 5) % 50) / 1000));
  const shares = Math.round(likes * (0.18 + ((h >> 9) % 40) / 1000));
  return { views, likes, shares };
}

/** 一键复制的智能体配置文本（真实 skillRef / 工具标识）。 */
export function agentCopyConfig(card: TemplateCard, meta: CategoryMeta): string {
  return [
    `AUBEAU 智能体 · ${card.title}`,
    `类别：${meta.label}`,
    `技能标识：${card.skillRef}`,
    card.tools.length > 0 ? `工具链：${card.tools.join("、")}` : "工具链：纯编排能力",
    `一句话：${card.tagline}`,
  ].join("\n");
}

export interface AgentCase {
  /** 案例图（真实截图或同目录真实封面）。 */
  img: string;
  /** 案例标题。 */
  title: string;
  /** 一句话说明。 */
  caption: string;
  /** 是否为该智能体自身的真实驱动截图（决定角标）。 */
  real: boolean;
}

/**
 * 案例画廊 —— 首张为本智能体的真实驱动截图（运行实况），
 * 其余取同目录真实封面作为「同类产出」，全部为真实素材。
 */
export function agentCases(card: TemplateCard, id: number): AgentCase[] {
  const meta = categoryMeta(card.category);
  const cases: AgentCase[] = [
    {
      img: agentShowcaseImage(id),
      title: "运行实况",
      caption: `「${card.title}」真实驱动截图 · ${meta.label}类`,
      real: true,
    },
  ];

  const related = relatedAgents(id, 3);
  related.forEach(({ card: rc }) => {
    cases.push({
      img: rc.cover,
      title: rc.title,
      caption: `${categoryMeta(rc.category).label} · ${rc.tagline}`,
      real: false,
    });
  });

  return cases.slice(0, 4);
}
