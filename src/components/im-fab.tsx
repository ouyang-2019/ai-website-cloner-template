"use client";

import { useState } from "react";
import { MessageSquareText, X, Plug } from "lucide-react";
import { useCredits } from "@/components/credits/credits-provider";

/** 可连接的 IM 渠道（品牌色 + 单字标识，避免外链图标资源）。 */
const CHANNELS: { id: string; name: string; color: string; glyph: string }[] = [
  { id: "wechat", name: "微信", color: "#07C160", glyph: "微" },
  { id: "wecom", name: "企业微信", color: "#2E80F0", glyph: "企" },
  { id: "feishu", name: "飞书", color: "#00D6B9", glyph: "飞" },
  { id: "dingtalk", name: "钉钉", color: "#1677FF", glyph: "钉" },
  { id: "slack", name: "Slack", color: "#E01E5A", glyph: "S" },
  { id: "discord", name: "Discord", color: "#5865F2", glyph: "D" },
  { id: "telegram", name: "Telegram", color: "#229ED9", glyph: "T" },
];

/**
 * 全局 IM 悬浮按钮（右下角）+ 渠道连接弹窗。
 * 替代原侧栏 IM 占位卡；点击渠道为占位（预留 /api/im/connect）。
 */
export function ImFab() {
  const [open, setOpen] = useState(false);
  const { showToast } = useCredits();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="连接 IM 渠道"
        title="连接 IM 渠道"
        className="fixed bottom-9 right-4 z-[55] flex h-12 w-12 items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition-transform hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg,#10b981 0%,#34d399 100%)" }}
      >
        <MessageSquareText className="h-5 w-5" strokeWidth={2} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-end p-4 sm:items-center sm:justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-[var(--neutral-grey200)] bg-white shadow-[var(--shadow-card)]">
            {/* 头部 */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--neutral-grey200)] px-4 py-3">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-[var(--brand-brand01-black)]">连接 IM 渠道</div>
                <div className="mt-0.5 text-[11px] text-[var(--text-icon-text-4)]">
                  绑定后，智能体产物可自动触达这些渠道
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--text-icon-text-4)] transition-colors hover:bg-[var(--neutral-grey100)] hover:text-[var(--text-icon-text-2)]"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {/* 渠道网格 */}
            <div className="grid grid-cols-3 gap-2 p-3">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => showToast(`即将连接 ${ch.name}（占位 · 预留 /api/im/connect）`, "info")}
                  className="group flex flex-col items-center gap-1.5 rounded-xl border border-[var(--neutral-grey200)] bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-[var(--neutral-grey400)] hover:shadow-[var(--shadow-card)] active:scale-[0.96]"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-semibold text-white"
                    style={{ backgroundColor: ch.color }}
                  >
                    {ch.glyph}
                  </span>
                  <span className="text-[12px] font-medium text-[var(--text-icon-text-2)]">{ch.name}</span>
                </button>
              ))}
            </div>

            {/* 底部提示 */}
            <div className="flex items-center justify-center gap-1.5 border-t border-[var(--neutral-grey200)] px-4 py-2.5 text-[11px] text-[var(--text-icon-text-5)]">
              <Plug className="h-3 w-3" strokeWidth={1.75} />
              邮件 / 短信 / 站内通知渠道即将支持
            </div>
          </div>
        </div>
      )}
    </>
  );
}
