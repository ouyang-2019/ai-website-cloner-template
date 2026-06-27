"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  CreditBalance,
  CreditTransaction,
  CreditTransactionType,
} from "@/types/credits";
import type { SubscriptionPlan } from "@/types/credits";
import { getPlanConfig } from "@/lib/credits";
import { claimWeeklyCredits, fetchCreditState, refundCredits, spendCredits } from "@/lib/api";

/**
 * Mock credits store — stands in for the Supabase-backed balance/transactions
 * in . In production these would be fetched from the AUBEAU credits API;
 * here we seed realistic state so the UI is fully interactive.
 */

interface CreditsState extends CreditBalance {
  transactions: CreditTransaction[];
}

interface CreditsContextValue extends CreditsState {
  /** Spend credits for a task; returns false if insufficient. */
  spend: (amount: number, description: string) => boolean;
  /** Refund credits for a failed task. */
  refund: (amount: number, description: string) => void;
  /** Claim the weekly free grant (free plan only). */
  claimWeekly: () => void;
  /** Switch plan (demo / pricing page). */
  setPlan: (plan: SubscriptionPlan) => void;
  /** Globally-controlled "insufficient credits" modal payload. */
  insufficient: { cost: number; feature: string } | null;
  notifyInsufficient: (cost: number, feature: string) => void;
  clearInsufficient: () => void;
  /** Globally-controlled tier-limit toast. */
  toast: { message: string; tone: "limit" | "info" } | null;
  showToast: (message: string, tone?: "limit" | "info") => void;
  clearToast: () => void;
}

const CreditsContext = createContext<CreditsContextValue | null>(null);

// Deterministic mock transaction seed (no Date.now in module scope to stay SSR-stable
// across renders; timestamps are fixed offsets from a base).
const BASE_TS = Date.UTC(2026, 5, 25, 12, 0, 0);
const tx = (
  id: string,
  transactionType: CreditTransactionType,
  amount: number,
  balanceAfter: number,
  description: string,
  minutesAgo: number
): CreditTransaction => ({
  id,
  transactionType,
  amount,
  balanceAfter,
  taskId: transactionType === "task_deduct" || transactionType === "task_refund" ? id : null,
  description,
  createdAt: new Date(BASE_TS - minutesAgo * 60_000).toISOString(),
});

const SEED_TRANSACTIONS: CreditTransaction[] = [
  tx("t1", "subscription_grant", 50000, 50000, "Business 套餐月度积分发放", 60 * 24 * 3),
  tx("t2", "task_deduct", 15, 4985, "配方审核 · 标准规则检查", 220),
  tx("t3", "task_deduct", 5, 4980, "原料合规 · 工具调用", 180),
  tx("t4", "task_refund", 15, 4995, "任务失败退还 · 安评报告队列", 150),
  tx("t5", "task_deduct", 30, 4965, "自主触发 · 爆品趋势雷达", 95),
  tx("t6", "task_deduct", 10, 4955, "工件发布 · 竞品背调报告", 60),
  tx("t7", "task_deduct", 8, 4947, "IM 触达 · 文案合规复核", 32),
  tx("t8", "bonus", 150, 5097, "新用户注册赠送", 20),
];

const SEED_BALANCE: CreditBalance = {
  balance: 50000,
  plan: "ultra",
  weeklyClaimed: true,
  dailyClaimed: true,
};

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CreditsState>({
    ...SEED_BALANCE,
    transactions: SEED_TRANSACTIONS,
  });
  const [insufficient, setInsufficient] = useState<{ cost: number; feature: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "limit" | "info" } | null>(null);

  useEffect(() => {
    let alive = true;
    fetchCreditState()
      .then(({ balance, transactions }) => {
        if (!alive) return;
        setState((s) => ({
          ...s,
          balance: balance.balance,
          // 测试模式：plan 锁定 ultra（最高订阅），不以后端返回覆盖，解锁全部高级功能。
          plan: "ultra",
          weeklyClaimed: balance.weeklyClaimed ?? balance.dailyClaimed ?? s.weeklyClaimed,
          dailyClaimed: balance.dailyClaimed ?? s.dailyClaimed,
          transactions: transactions.length > 0 ? transactions : s.transactions,
        }));
      })
      .catch(() => {
        // No token/backend in local design mode: keep deterministic mock state.
      });
    return () => {
      alive = false;
    };
  }, []);

  const spend = useCallback((amount: number, description: string) => {
    let ok = false;
    let txId = "";
    setState((s) => {
      if (s.balance < amount) return s;
      ok = true;
      txId = `t${s.transactions.length + 1}`;
      const next: CreditTransaction = {
        id: txId,
        transactionType: "task_deduct",
        amount: -amount,
        balanceAfter: s.balance - amount,
        taskId: txId,
        description,
        createdAt: new Date().toISOString(),
      };
      return {
        ...s,
        balance: s.balance - amount,
        transactions: [next, ...s.transactions],
      };
    });
    if (ok) {
      void spendCredits(amount, description, txId).catch(() => {
        // Keep the local UX responsive; backend errors surface on the next refresh.
      });
    }
    return ok;
  }, []);

  const refund = useCallback((amount: number, description: string) => {
    let txId = "";
    setState((s) => {
      txId = `t${s.transactions.length + 1}`;
      const next: CreditTransaction = {
        id: txId,
        transactionType: "task_refund",
        amount,
        balanceAfter: s.balance + amount,
        taskId: txId,
        description,
        createdAt: new Date().toISOString(),
      };
      return {
        ...s,
        balance: s.balance + amount,
        transactions: [next, ...s.transactions],
      };
    });
    void refundCredits(amount, description, txId).catch(() => {
      // Local refund remains visible; backend reconciliation occurs on refresh.
    });
  }, []);

  const claimWeekly = useCallback(() => {
    void claimWeeklyCredits().catch(() => {
      // Keep mock fallback usable when unauthenticated.
    });
    setState((s) => {
      if (s.weeklyClaimed ?? s.dailyClaimed) return s;
      const grant = getPlanConfig(s.plan).weeklyCredits;
      const next: CreditTransaction = {
        id: `t${s.transactions.length + 1}`,
        transactionType: "weekly_grant",
        amount: grant,
        balanceAfter: s.balance + grant,
        taskId: null,
        description: "每周免费积分领取",
        createdAt: new Date().toISOString(),
      };
      return {
        ...s,
        balance: s.balance + grant,
        weeklyClaimed: true,
        dailyClaimed: true,
        transactions: [next, ...s.transactions],
      };
    });
  }, []);

  const setPlan = useCallback((plan: SubscriptionPlan) => {
    setState((s) => ({ ...s, plan }));
  }, []);

  const value = useMemo<CreditsContextValue>(
    () => ({
      ...state,
      spend,
      refund,
      claimWeekly,
      setPlan,
      insufficient,
      notifyInsufficient: (cost, feature) => setInsufficient({ cost, feature }),
      clearInsufficient: () => setInsufficient(null),
      toast,
      showToast: (message, tone = "info") => setToast({ message, tone }),
      clearToast: () => setToast(null),
    }),
    [state, spend, refund, claimWeekly, setPlan, insufficient, toast]
  );

  return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>;
}

export function useCredits(): CreditsContextValue {
  const ctx = useContext(CreditsContext);
  if (!ctx) {
    throw new Error("useCredits must be used within a CreditsProvider");
  }
  return ctx;
}
