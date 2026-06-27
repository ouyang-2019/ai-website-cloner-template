"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Download,
  FileText,
  Presentation,
  Film,
  Radio,
  FileBarChart,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { MessageArtifact, ArtifactDetail, ArtifactType } from "@/types";

/** 工件类型 → 图标 + 中文标签（画布顶部 badge / 空态）。 */
const TYPE_META: Record<ArtifactType, { icon: LucideIcon; label: string }> = {
  report: { icon: FileBarChart, label: "报告" },
  doc: { icon: FileText, label: "文档" },
  ppt: { icon: Presentation, label: "演示" },
  video: { icon: Film, label: "视频" },
  channel: { icon: Radio, label: "渠道" },
};

/** 后端 §13.2 不可用时的类型化占位（保证画布始终有可读内容）。 */
function placeholder(id: string, type: ArtifactType | undefined): ArtifactDetail {
  const t = type ?? "doc";
  const meta = TYPE_META[t];
  return {
    id,
    type: t,
    title: `${meta.label}产物`,
    html: `<!doctype html><html><head><meta charset="utf-8"><style>
      body{margin:0;font-family:-apple-system,"PingFang SC",system-ui,sans-serif;background:#f8fafc;color:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:32px}
      .c{max-width:420px;text-align:center}
      .i{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#10b981,#34d399);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#fff;font-size:24px;font-weight:700}
      h1{font-size:18px;margin:0 0 8px} p{font-size:13px;color:#64748b;margin:0 0 4px;line-height:1.6}
      .tag{display:inline-block;margin-top:14px;padding:4px 10px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:11px}
    </style></head><body><div class="c"><div class="i">${meta.label[0]}</div><h1>${meta.label}产物已生成</h1><p>这是演示占位。后端 §13.2 接通后，此处将实时渲染真实产物的 HTML（报告 / 文档 / PPT 等）。</p><p style="color:#94a3b8;font-size:11px">artifact · ${id.slice(0, 16)}</p><span class="tag">翡翠主题 · sandbox 渲染</span></div></body></html>`,
  };
}

/**
 * 同步画布（桌面右侧常驻 / 移动端全屏覆盖；可折叠）。
 *  数据源优先级：streamingHtml（流式实时，AI 边生成 HTML 边渲染）>
 *               §13.2 GET /artifacts/:id（最终产物，catch 回落 seedArtifacts/占位）>
 *               类型化静态预览（video/channel 等无 HTML）。
 *  渲染：HTML 在 sandbox="" iframe（禁脚本/同源/弹窗，等价 ppt-creator 安全级别）。
 *  工具栏：新窗口打开 / 复制 HTML / 全屏 / 缩放。
 */
export function ArtifactCanvas({
  artifacts,
  activeId,
  onActivate,
  onClose,
  seedArtifacts,
  streamingHtml,
  className = "",
}: {
  artifacts: MessageArtifact[];
  activeId: string;
  onActivate: (id: string) => void;
  onClose: () => void;
  seedArtifacts?: Record<string, ArtifactDetail>;
  /** 流式实时 HTML（AI 生成 HTML/PPT 时边写边渲染；非空时优先于 §13.2）。 */
  streamingHtml?: string;
  className?: string;
}) {
  const [detail, setDetail] = useState<ArtifactDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const active = artifacts.find((a) => a.artifactId === activeId) ?? artifacts[artifacts.length - 1] ?? null;
  const activeRealId = active?.artifactId ?? activeId;
  const streaming = !!(streamingHtml && streamingHtml.trim());

  useEffect(() => {
    if (!activeRealId || streaming) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiFetch<ArtifactDetail>(`/artifacts/${activeRealId}`)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setDetail(seedArtifacts?.[activeRealId] ?? placeholder(activeRealId, active?.type));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRealId, streaming]);

  useEffect(() => {
    setZoom(1);
  }, [activeRealId, streaming]);

  const renderHtml = streaming ? streamingHtml! : detail?.html;
  const hasHtml = !!renderHtml;

  const openInNewWindow = () => {
    if (!renderHtml) return;
    const blob = new Blob([renderHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const copyHtml = async () => {
    if (!renderHtml) return;
    try {
      await navigator.clipboard?.writeText(renderHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 剪贴板不可用时静默 */
    }
  };

  const toggleFullscreen = () => {
    const el = iframeRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      el.requestFullscreen?.();
    }
  };

  const cycleZoom = () =>
    setZoom((z) => (z === 1 ? 1.25 : z === 1.25 ? 1.5 : z === 1.5 ? 0.75 : 1));

  // 空态：无工件且无流式 HTML。
  if (!active && !streaming) {
    return (
      <aside
        className={`flex h-full flex-col items-center justify-center gap-3 border-l border-[var(--glass-border-subtle)] bg-[var(--glass-bg-strong)] px-6 text-center backdrop-blur-xl saturate-150 ${className}`}
      >
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
          style={{ backgroundImage: "var(--gradient-brand)" }}
        >
          <FileText className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <p className="text-[13px] font-medium text-[var(--text-icon-text-2)]">同步画布</p>
        <p className="max-w-[220px] text-[12px] leading-[18px] text-[var(--text-icon-text-4)]">
          智能体生成的产物（报告 / 文档 / PPT / 视频）将在此处实时渲染，与对话联动。
        </p>
      </aside>
    );
  }

  const meta = TYPE_META[active?.type ?? "doc"] ?? TYPE_META.doc;
  const Icon = meta.icon;
  const titleText = streaming ? "实时生成中…" : (detail?.title ?? active?.title ?? `${meta.label}产物`);

  return (
    <aside
      className={`flex h-full flex-col border-l border-[var(--glass-border-subtle)] bg-[var(--glass-bg-strong)] backdrop-blur-xl saturate-150 ${className}`}
    >
      {/* 顶部：类型图标 + 标题 + 类型 badge + 多工件切换 + 工具栏 + 关闭 */}
      <header className="flex h-12 shrink-0 items-center gap-1.5 border-b border-[var(--glass-border-subtle)] px-3">
        <Icon className={`h-4 w-4 shrink-0 text-[var(--brand-brand03-blue)] ${streaming ? "animate-pulse" : ""}`} strokeWidth={2} />
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--text-icon-text-1)]">
          {titleText}
        </span>
        <span className="hidden shrink-0 rounded bg-[var(--neutral-grey100)] px-1.5 py-0.5 text-[10px] text-[var(--text-icon-text-4)] sm:inline">
          {streaming ? "流式" : meta.label}
        </span>
        {!streaming && artifacts.length > 1 && (
          <div className="flex shrink-0 items-center gap-1">
            {artifacts.map((a, i) => (
              <button
                key={a.artifactId}
                type="button"
                onClick={() => onActivate(a.artifactId)}
                title={a.title ?? `产物 ${i + 1}`}
                aria-label={`切换到产物 ${i + 1}`}
                className={`h-1.5 w-5 rounded-full transition-colors ${
                  a.artifactId === activeRealId ? "bg-[var(--brand-brand03-blue)]" : "bg-[var(--neutral-grey200)]"
                }`}
              />
            ))}
          </div>
        )}

        {/* 工具栏：新窗口 / 复制 HTML / 全屏 / 缩放 / 关闭 */}
        <div className="flex shrink-0 items-center gap-0.5">
          <ToolBtn label="新窗口打开" disabled={!hasHtml} onClick={openInNewWindow}>
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
          </ToolBtn>
          <ToolBtn label="复制 HTML" disabled={!hasHtml} onClick={copyHtml}>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[var(--brand-brand03-blue)]" strokeWidth={2.5} />
            ) : (
              <Copy className="h-3.5 w-3.5" strokeWidth={2} />
            )}
          </ToolBtn>
          <ToolBtn label="全屏" disabled={!hasHtml} onClick={toggleFullscreen}>
            <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />
          </ToolBtn>
          <ToolBtn label="缩放" disabled={!hasHtml} onClick={cycleZoom}>
            <ZoomIn className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="tabular-nums text-[10px]">{Math.round(zoom * 100)}%</span>
          </ToolBtn>
          <ToolBtn label="收起画布" onClick={onClose}>
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </ToolBtn>
        </div>
      </header>

      {/* 主体：iframe 渲染 HTML（sandbox 最严格 + 缩放；流式优先），或类型化静态预览 */}
      <div className="relative flex-1 overflow-hidden bg-[var(--neutral-grey100)]">
        {streaming ? (
          <iframe
            ref={iframeRef}
            title="streaming"
            srcDoc={renderHtml}
            sandbox=""
            className="h-full w-full border-0"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
            }}
          />
        ) : loading ? (
          <div className="flex h-full items-center justify-center text-[var(--text-icon-text-4)]">
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
          </div>
        ) : hasHtml ? (
          <iframe
            ref={iframeRef}
            title={activeRealId}
            srcDoc={renderHtml}
            sandbox=""
            className="h-full w-full border-0"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
            }}
          />
        ) : (
          <TypePreview type={active?.type ?? "doc"} title={detail?.title ?? active?.title} />
        )}
      </div>

      {/* 底部：工件 ID + 下载入口 */}
      <footer className="flex h-10 shrink-0 items-center justify-between gap-2 border-t border-[var(--glass-border-subtle)] px-3">
        <span className="min-w-0 truncate text-[11px] text-[var(--text-icon-text-4)]">
          {streaming ? "实时预览 · 流式渲染中" : `ID · ${activeRealId.slice(0, 16)}`}
        </span>
        {!streaming && (
          <a
            href={`/api/artifacts/${activeRealId}/download`}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-[var(--text-icon-text-3)] transition-colors hover:bg-[var(--neutral-grey60)]"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2} /> 下载
          </a>
        )}
      </footer>
    </aside>
  );
}

/** 工具栏小按钮（图标 + 可选文字；hover 玻璃底）。 */
function ToolBtn({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-7 min-w-[28px] items-center justify-center gap-1 rounded-md px-1.5 text-[var(--text-icon-text-4)] transition-[color,background-color,transform] duration-150 ease-out hover:bg-[var(--neutral-grey60)] hover:text-[var(--text-icon-text-2)] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** 无 HTML 的类型（video/channel）静态预览卡。 */
function TypePreview({ type, title }: { type: ArtifactType; title?: string }) {
  const meta = TYPE_META[type] ?? TYPE_META.doc;
  const Icon = meta.icon;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--neutral-grey60)] text-[var(--brand-brand03-blue)]">
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <p className="text-[14px] font-medium text-[var(--text-icon-text-2)]">{title ?? `${meta.label}产物`}</p>
      <p className="max-w-[240px] text-[12px] leading-[18px] text-[var(--text-icon-text-4)]">
        此类产物（{meta.label}）暂无内嵌预览，可点击底部「下载」获取完整文件。
      </p>
    </div>
  );
}
