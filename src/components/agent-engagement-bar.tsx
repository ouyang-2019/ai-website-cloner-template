"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { Eye, Heart, Share2, Check } from "lucide-react";
import { useCredits } from "@/components/credits/credits-provider";
import { agentEngagementSeed } from "@/lib/agent-showcase";

/**
 * 介绍页右上角互动条 —— 观看（点看即计数）/ 收藏（切换）/ 转发（复制链接或原生分享）。
 *
 * 用 useSyncExternalStore 订阅 localStorage（React 19 推荐的外部存储读取方式），
 * 规避「effect 内 setState」与服务端/客户端水合不一致：服务端快照返回 0/false，
 * 挂载后切到真实快照，写入后派发自定义事件触发同标签页重渲染。
 */
const CHANGE_EVENT = "aubeau:eng-change";

function readSnapshot(agentId: number): string {
  const v = Number(localStorage.getItem(`aubeau:agent-view:${agentId}`) ?? 0);
  const f = localStorage.getItem(`aubeau:agent-fav:${agentId}`) === "1" ? "1" : "0";
  return `${v}:${f}`;
}

export function AgentEngagementBar({
  agentId,
  title,
}: {
  agentId: number;
  title: string;
}) {
  const { showToast } = useCredits();
  const seed = agentEngagementSeed(agentId);

  const subscribe = useCallback((cb: () => void) => {
    const handler = () => cb();
    window.addEventListener("storage", handler);
    window.addEventListener(CHANGE_EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(CHANGE_EVENT, handler);
    };
  }, []);

  // 服务端快照恒定（0:0），保证与首屏一致；客户端快照读真实本地累计。
  const snap = useSyncExternalStore(
    subscribe,
    () => readSnapshot(agentId),
    () => "0:0",
  );
  const [storedViews, favFlag] = snap.split(":");
  const views = seed.views + Number(storedViews);
  const liked = favFlag === "1";
  const likes = seed.likes + (liked ? 1 : 0);
  const [shared, setShared] = useState(false);

  const onView = () => {
    try {
      const key = `aubeau:agent-view:${agentId}`;
      const next = Number(localStorage.getItem(key) ?? 0) + 1;
      localStorage.setItem(key, String(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      /* noop */
    }
  };

  const onFavorite = () => {
    try {
      const key = `aubeau:agent-fav:${agentId}`;
      const next = localStorage.getItem(key) !== "1" ? "1" : "0";
      localStorage.setItem(key, next);
      window.dispatchEvent(new Event(CHANGE_EVENT));
      showToast(next === "1" ? `已收藏「${title}」` : "已取消收藏", "info");
    } catch {
      /* noop */
    }
  };

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    setShared(true);
    setTimeout(() => setShared(false), 1600);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: `AUBEAU · ${title}`, url });
        showToast("已转发", "info");
        return;
      }
    } catch {
      /* 用户取消分享，回落到复制 */
    }
    try {
      await navigator.clipboard?.writeText(url);
      showToast("链接已复制，可粘贴转发", "info");
    } catch {
      showToast("请手动复制地址栏链接", "info");
    }
  };

  // 仅在 10 万以上折叠为「w」，保证常见量级（千~万）点击 +1 有可见反馈。
  const countLabel = (n: number) => (n >= 100000 ? `${(n / 10000).toFixed(1)}w` : String(n));

  return (
    <div className="flex items-center gap-1.5">
      {/* 观看 —— 点看即计数 */}
      <button
        type="button"
        onClick={onView}
        aria-label="观看"
        className="group inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] px-3.5 text-[12px] text-[var(--text-icon-text-3)] shadow-[var(--shadow-card)] backdrop-blur-[18px] saturate-150 transition-[transform,color,background-color] hover:bg-[var(--neutral-grey60)] hover:text-[var(--text-icon-text-1)] active:scale-[0.96]"
      >
        <Eye className="h-4 w-4" strokeWidth={2} />
        <span className="tabular-nums font-medium">{countLabel(views)}</span>
      </button>

      {/* 收藏 —— 切换 + 心形动画 */}
      <button
        type="button"
        onClick={onFavorite}
        aria-label={liked ? "取消收藏" : "收藏"}
        aria-pressed={liked}
        className="group inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] px-3.5 text-[12px] text-[var(--text-icon-text-3)] shadow-[var(--shadow-card)] backdrop-blur-[18px] saturate-150 transition-[transform,color,background-color] hover:bg-[var(--neutral-grey60)] hover:text-[var(--text-icon-text-1)] active:scale-[0.96]"
      >
        <Heart
          className={`h-4 w-4 transition-[transform,color,fill] duration-200 ${liked ? "scale-110 text-[#FF576D] fill-[#FF576D]" : "text-[var(--text-icon-text-3)] group-hover:text-[var(--text-icon-text-1)]"}`}
          strokeWidth={2}
        />
        <span className="tabular-nums font-medium">{countLabel(likes)}</span>
      </button>

      {/* 转发 —— 复制链接 / 原生分享 */}
      <button
        type="button"
        onClick={onShare}
        aria-label="转发"
        className="group inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] px-3.5 text-[12px] text-[var(--text-icon-text-3)] shadow-[var(--shadow-card)] backdrop-blur-[18px] saturate-150 transition-[transform,color,background-color] hover:bg-[var(--neutral-grey60)] hover:text-[var(--text-icon-text-1)] active:scale-[0.96]"
      >
        {shared ? (
          <Check className="h-4 w-4 text-[#10b981]" strokeWidth={2.5} />
        ) : (
          <Share2 className="h-4 w-4" strokeWidth={2} />
        )}
        <span className="font-medium">转发</span>
      </button>
    </div>
  );
}
