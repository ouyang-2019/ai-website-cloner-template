// AUBEAU credits/billing types — adapted from 's credits model
// for an enterprise AI-agent platform (agent tasks instead of image/video gen).

/** 订阅套餐档位 */
export type SubscriptionPlan = "free" | "starter" | "pro" | "ultra" | "business";

/** 计费周期 */
export type BillingPeriod = "monthly" | "yearly";

/** 积分交易类型 */
export type CreditTransactionType =
  | "subscription_grant"
  | "weekly_grant"
  | "daily_grant"
  | "purchase"
  | "task_deduct"
  | "task_refund"
  | "admin_adjustment"
  | "bonus";

/** 智能体任务复杂度档位（决定单次任务积分消耗） */
export type TaskComplexity = "light" | "standard" | "heavy";

/** 智能体能力标识（决定最低套餐要求） */
export type AgentCapability =
  | "chat"
  | "tool-call"
  | "memory-retrieval"
  | "artifact-publish"
  | "orchestration"
  | "autonomous-trigger"
  | "im-channel";

/** 单条积分交易记录 */
export interface CreditTransaction {
  id: string;
  transactionType: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  taskId: string | null;
  description: string | null;
  createdAt: string;
}

/** 当前积分余额 + 套餐状态 */
export interface CreditBalance {
  balance: number;
  plan: SubscriptionPlan;
  weeklyClaimed?: boolean;
  dailyClaimed: boolean;
}

export interface CreditEstimateRequest {
  capability: AgentCapability;
  complexity?: TaskComplexity;
  model?: string | null;
  expectedRounds?: number;
  perRoundWorstCredits?: number;
  knownToolCredits?: number;
  hasUnknownCost?: boolean;
}

export interface CreditEstimate {
  allowed: boolean;
  lock: boolean;
  verdict: "ok" | "partial" | "blocked" | string;
  low: number;
  high: number;
  unavailable: boolean;
  available: number;
  balance?: number;
  plan?: SubscriptionPlan;
  reachableRounds: number;
  topupNeeded: number;
  shortfall: number;
  capability?: AgentCapability | string;
  complexity?: TaskComplexity | string;
  model?: string | null;
  note?: string;
  rechargeUrl?: string;
  upgradeUrl?: string;
}
