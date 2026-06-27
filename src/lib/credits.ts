// AUBEAU 积分系统配置 — adapted from 's credits.ts
// (https://github.com/fancyboi999//blob/main/packages/shared/src/credits.ts)
//
// Domain shift:  bills image/video generation per model+quality.
// AUBEAU bills 智能体任务 (agent tasks) per capability+complexity.
// Credit amounts and display prices mirror 's tier allocation.

import type {
  SubscriptionPlan,
  BillingPeriod,
  TaskComplexity,
  AgentCapability,
} from "@/types/credits";

// ── 套餐配置 ────────────────────────────────────────────────

export interface PlanConfig {
  plan: SubscriptionPlan;
  /** 套餐展示名 */
  displayName: string;
  /** 月度订阅积分（free 用每周赠送额度） */
  monthlyCredits: number;
  /** 每周免费积分（仅 free 套餐） */
  weeklyCredits: number;
  /** @deprecated 后端旧合同字段，保留兼容；新逻辑读取 weeklyCredits。 */
  dailyCredits: number;
  /** 最大并发智能体任务数 */
  maxConcurrentTasks: number;
  /** 最大已发布智能体数（-1 = 不限） */
  maxAgents: number;
  /** 工件是否带水印 */
  watermark: boolean;
  /** 是否开放长期记忆 */
  longTermMemory: boolean;
  /** Monthly display price (USD) */
  monthlyPrice: number;
  /** Yearly billing display price per month (USD) */
  yearlyPrice: number;
  /** 特性列表（定价页展示） */
  features: string[];
  /** 强调色（定价卡/徽章） */
  accent: string;
}

export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanConfig> = {
  free: {
    plan: "free",
    displayName: "Free",
    monthlyCredits: 0,
    weeklyCredits: 150,
    dailyCredits: 0,
    maxConcurrentTasks: 1,
    maxAgents: 3,
    watermark: true,
    longTermMemory: false,
    monthlyPrice: 0,
    yearlyPrice: 0,
    accent: "#7f8896",
    features: [
      "每周 150 积分",
      "1 个并发任务",
      "最多 3 个智能体",
      "基础对话与工具调用",
      "工件带水印",
    ],
  },
  starter: {
    plan: "starter",
    displayName: "Starter",
    monthlyCredits: 1200,
    weeklyCredits: 0,
    dailyCredits: 0,
    maxConcurrentTasks: 2,
    maxAgents: 10,
    watermark: false,
    longTermMemory: false,
    monthlyPrice: 39,
    yearlyPrice: 37,
    accent: "#10b981",
    features: [
      "每月 1,200 积分",
      "2 个并发任务",
      "最多 10 个智能体",
      "工件发布 · IM 渠道触达",
      "无水印",
    ],
  },
  pro: {
    plan: "pro",
    displayName: "Pro",
    monthlyCredits: 5000,
    weeklyCredits: 0,
    dailyCredits: 0,
    maxConcurrentTasks: 4,
    maxAgents: 50,
    watermark: false,
    longTermMemory: true,
    monthlyPrice: 99,
    yearlyPrice: 94,
    accent: "#34d399",
    features: [
      "每月 5,000 积分",
      "4 个并发任务",
      "最多 50 个智能体",
      "长期记忆 · 多步编排",
      "自主触发",
    ],
  },
  ultra: {
    plan: "ultra",
    displayName: "Ultra",
    monthlyCredits: 15000,
    weeklyCredits: 0,
    dailyCredits: 0,
    maxConcurrentTasks: 8,
    maxAgents: 200,
    watermark: false,
    longTermMemory: true,
    monthlyPrice: 249,
    yearlyPrice: 237,
    accent: "#ff576d",
    features: [
      "每月 15,000 积分",
      "8 个并发任务",
      "最多 200 个智能体",
      "全部能力解锁",
      "优先队列",
    ],
  },
  business: {
    plan: "business",
    displayName: "Business",
    monthlyCredits: 50000,
    weeklyCredits: 0,
    dailyCredits: 0,
    maxConcurrentTasks: 12,
    maxAgents: -1,
    watermark: false,
    longTermMemory: true,
    monthlyPrice: 249,
    yearlyPrice: 236,
    accent: "#000818",
    features: [
      "每月 50,000 积分",
      "12 个并发任务",
      "智能体数量不限",
      "团队协作 · 权限管理",
      "专属支持与 SLA",
    ],
  },
};

export const PLAN_ORDER: SubscriptionPlan[] = ["free", "starter", "pro", "ultra"];

/** 按展示顺序的套餐列表（定价页用） */
export const PLANS_FOR_PRICING: SubscriptionPlan[] = [
  "free",
  "starter",
  "pro",
  "ultra",
];

// ── 能力最低套餐门槛 ─────────────────────────────────────────
// 未列出的能力默认要求 "starter"。

export const CAPABILITY_MIN_TIER: Record<AgentCapability, SubscriptionPlan> = {
  chat: "free",
  "tool-call": "free",
  "memory-retrieval": "free",
  "artifact-publish": "starter",
  "im-channel": "starter",
  orchestration: "pro",
  "autonomous-trigger": "pro",
};

/** 判断套餐是否满足某能力的最低门槛 */
export function canAccessCapability(
  userPlan: SubscriptionPlan,
  capability: AgentCapability
): boolean {
  const minTier = CAPABILITY_MIN_TIER[capability];
  return PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(minTier);
}

/** 获取套餐配置 */
export function getPlanConfig(plan: SubscriptionPlan): PlanConfig {
  return PLAN_CONFIGS[plan];
}

// ── 智能体任务积分成本表 ─────────────────────────────────────
// 按「能力 × 复杂度」计费（对标  的 model × quality 成本表）。

export const TASK_COSTS: Record<AgentCapability, Record<TaskComplexity, number>> = {
  chat: { light: 1, standard: 2, heavy: 3 },
  "tool-call": { light: 3, standard: 5, heavy: 8 },
  "memory-retrieval": { light: 2, standard: 3, heavy: 5 },
  "artifact-publish": { light: 5, standard: 10, heavy: 20 },
  orchestration: { light: 8, standard: 15, heavy: 30 },
  "autonomous-trigger": { light: 15, standard: 30, heavy: 60 },
  "im-channel": { light: 4, standard: 6, heavy: 10 },
};

const DEFAULT_TASK_COST: Record<TaskComplexity, number> = {
  light: 3,
  standard: 5,
  heavy: 10,
};

/** 计算单次智能体任务的积分消耗 */
export function getTaskCost(
  capability: AgentCapability,
  complexity: TaskComplexity = "standard"
): number {
  return (TASK_COSTS[capability] ?? DEFAULT_TASK_COST)[complexity];
}

export type AgentBillingMode = "fixed_per_run" | "token_metered";

export const ADVANCED_AGENT_FIXED_RUN_CREDITS = 20;

export const FIXED_PER_RUN_AGENT_SKILL_REFS = new Set<string>([
  "cosmetic_formula_review",
  "cosmetic_safety_report",
  "cosmetic_ingredient_compliance",
  "cosmetic_claim_compliance",
  "cosmetic_artwork_consistency",
  "cosmetic_reference_formula",
  "beauty_trend_radar",
]);

export interface AgentRunCostInput {
  capability: AgentCapability;
  complexity?: TaskComplexity;
  skillRef?: string;
}

export function getAgentBillingMode(skillRef?: string): AgentBillingMode {
  return skillRef && FIXED_PER_RUN_AGENT_SKILL_REFS.has(skillRef)
    ? "fixed_per_run"
    : "token_metered";
}

export function getAgentRunCost(agent: AgentRunCostInput): number {
  if (getAgentBillingMode(agent.skillRef) === "fixed_per_run") {
    return ADVANCED_AGENT_FIXED_RUN_CREDITS;
  }
  return getTaskCost(agent.capability, agent.complexity ?? "standard");
}

// ── 价格展示 ─────────────────────────────────────────────────

/** Return the display price for a billing period. */
export function getDisplayPrice(
  plan: SubscriptionPlan,
  period: BillingPeriod
): number {
  const cfg = PLAN_CONFIGS[plan];
  return period === "yearly" ? cfg.yearlyPrice : cfg.monthlyPrice;
}

/**
 * 套餐促销折扣（X 折 = 原价 X%）：月付统一 95 折；年付 Starter/Pro 88 折、Ultra/Business 73 折。
 * Free 不打折。年付本身已是 95 折基底（yearlyPrice），此处 88/73 是「再叠加」的限时优惠。
 * 与首页/订阅页/登录页广告栏、定价卡折扣标签口径完全一致。
 */
export function planDiscount(
  plan: SubscriptionPlan,
  period: BillingPeriod
): number | null {
  if (plan === "free") return null;
  if (period === "monthly") return 95;
  return plan === "ultra" ? 73 : 88;
}

/** 折后单价（每月）：getDisplayPrice × 折扣，Math.round 取整；无折扣时返回原价。 */
export function getDiscountedPrice(
  plan: SubscriptionPlan,
  period: BillingPeriod
): number {
  const base = getDisplayPrice(plan, period);
  const d = planDiscount(plan, period);
  if (!d || d >= 100) return base;
  return Math.round((base * d) / 100);
}

/** 原价合计（划线用）：年付 = 月单价×12，月付 = 月单价。 */
export function getOriginalTotal(
  plan: SubscriptionPlan,
  period: BillingPeriod
): number {
  const unit = getDisplayPrice(plan, period);
  return period === "yearly" ? unit * 12 : unit;
}

/** 折后应付合计：年付 = 折后月单价×12，月付 = 折后月单价。结账以此金额为准。 */
export function getCheckoutTotal(
  plan: SubscriptionPlan,
  period: BillingPeriod
): number {
  const unit = getDiscountedPrice(plan, period);
  return period === "yearly" ? unit * 12 : unit;
}

/** 价格货币标签 */
export const CURRENCY = "$";

// ── 档位徽章文案 ─────────────────────────────────────────────

/** 能力的中文展示名 */
export const CAPABILITY_LABELS: Record<AgentCapability, string> = {
  chat: "对话",
  "tool-call": "工具调用",
  "memory-retrieval": "记忆检索",
  "artifact-publish": "工件发布",
  orchestration: "多步编排",
  "autonomous-trigger": "自主触发",
  "im-channel": "IM 渠道",
};

/** 最低套餐徽章文案（如 "Pro" / "Free"） */
export function minTierLabel(capability: AgentCapability): string {
  return PLAN_CONFIGS[CAPABILITY_MIN_TIER[capability]].displayName;
}
