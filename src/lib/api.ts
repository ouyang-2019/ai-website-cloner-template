"use client";

import type {
  CreditEstimate,
  CreditEstimateRequest,
  CreditTransaction,
  CreditTransactionType,
  SubscriptionPlan,
} from "@/types/credits";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "/api").replace(/\/$/, "");

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_AUBEAU_DEMO_TOKEN || null;
  }
  return window.localStorage.getItem("aubeau_token") || process.env.NEXT_PUBLIC_AUBEAU_DEMO_TOKEN || null;
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("aubeau_token", token);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `AUBEAU API request failed: ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export interface ApiCreditBalance {
  balance: number;
  plan: SubscriptionPlan;
  monthlyCredits?: number;
  usedCredits?: number;
  expiresAt?: string;
  weeklyClaimed?: boolean;
  dailyClaimed?: boolean;
}

function toTransactionType(type: string): CreditTransactionType {
  if (type === "spend") return "task_deduct";
  if (type === "refund") return "task_refund";
  if (type === "weekly") return "weekly_grant";
  if (type === "daily") return "daily_grant";
  if (type === "recharge") return "purchase";
  return "bonus";
}

export function toCreditTransaction(raw: Record<string, unknown>, balanceFallback: number): CreditTransaction {
  const amount = Number(raw.amount ?? raw.credits ?? 0);
  const type = String(raw.type ?? raw.transactionType ?? "bonus");
  const createdAt = String(raw.createdAt ?? raw.created_at ?? new Date().toISOString());
  return {
    id: String(raw.id ?? raw.key ?? createdAt),
    transactionType: toTransactionType(type),
    amount,
    balanceAfter: Number(raw.balanceAfter ?? raw.balance_after ?? balanceFallback),
    taskId: raw.taskId ? String(raw.taskId) : null,
    description: raw.reason ? String(raw.reason) : raw.description ? String(raw.description) : null,
    createdAt,
  };
}

export async function fetchCreditState(): Promise<{ balance: ApiCreditBalance; transactions: CreditTransaction[] }> {
  const balance = await apiFetch<ApiCreditBalance>("/credits/balance");
  const txPage = await apiFetch<{ items: Record<string, unknown>[]; total: number }>("/credits/transactions?page=1&size=20");
  return {
    balance,
    transactions: txPage.items.map((tx) => toCreditTransaction(tx, balance.balance)),
  };
}

export async function spendCredits(amount: number, reason: string, refId?: string): Promise<{ ok: boolean; balance?: number; txId?: string; shortfall?: number }> {
  return apiFetch("/credits/spend", {
    method: "POST",
    body: JSON.stringify({ amount, reason, refId }),
  });
}

export async function estimateCredits(body: CreditEstimateRequest): Promise<CreditEstimate> {
  return apiFetch("/credits/estimate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function refundCredits(amount: number, reason: string, txId?: string): Promise<{ balance: number }> {
  return apiFetch("/credits/refund", {
    method: "POST",
    body: JSON.stringify({ amount, reason, txId }),
  });
}

export async function claimDailyCredits(): Promise<{ claimed?: boolean; amount?: number; balance?: number; error?: string }> {
  return apiFetch("/credits/claim-daily", { method: "POST" });
}

export async function claimWeeklyCredits(): Promise<{ claimed?: boolean; amount?: number; balance?: number; error?: string; weeklyClaimed?: boolean; dailyClaimed?: boolean }> {
  return apiFetch("/credits/claim-weekly", { method: "POST" });
}

export async function readSse(
  response: Response,
  handlers: Record<string, (payload: Record<string, unknown>) => void>
): Promise<void> {
  if (!response.ok || !response.body) {
    throw new Error(`SSE request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const eventLine = frame.split("\n").find((line) => line.startsWith("event:"));
      const dataLine = frame.split("\n").find((line) => line.startsWith("data:"));
      if (!eventLine || !dataLine) continue;
      const event = eventLine.replace("event:", "").trim();
      const payload = JSON.parse(dataLine.replace("data:", "").trim()) as Record<string, unknown>;
      handlers[event]?.(payload);
    }
  }
}

export async function openSse(path: string, body: unknown, handlers: Record<string, (payload: Record<string, unknown>) => void>): Promise<void> {
  const token = getAuthToken();
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  await readSse(response, handlers);
}
