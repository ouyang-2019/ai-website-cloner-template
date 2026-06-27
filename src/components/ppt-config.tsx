"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Check, Presentation, Sparkles } from "lucide-react";
import { PPT_TEMPLATES, PPT_SIZES } from "@/data/ppt";

/** 常用页数预设（另支持自定义）。 */
const PAGE_PRESETS = [5, 9, 15, 25] as const;
/** 智选模板 id — 不绑定具体模板，由编排引擎自动决定风格。 */
export const PPT_TEMPLATE_AUTO = "auto";
/** 智选强调色（brand-ish）。 */
const AUTO_ACCENT = "#6E8BFF";

/**
 * PPT 配置条 — 页数 / 尺寸 / 模板，均为下拉按钮（优化显示，节省横向空间）。
 * - 模板含「智选」：自动生成、不受模板约束。
 * - 页数含「自定义」：预设 5/9/15/25，可输入任意数字。
 * 挂载 ppt 技能时由项目工作台以 ChatComposer topSlot 形式渲染。
 */
export interface PptConfigProps {
  pages: number;
  size: string;
  template: string;
  onPagesChange: (n: number) => void;
  onSizeChange: (id: string) => void;
  onTemplateChange: (id: string) => void;
}

type Open = null | "pages" | "size" | "template";

/** 通用下拉按钮：触发器 + 向下展开的面板（点击外部关闭）。 */
function Dropdown({
  open,
  onClose,
  trigger,
  children,
}: {
  open: boolean;
  onClose: () => void;
  trigger: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      {trigger}
      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={onClose} aria-hidden />
          <div className="glass-strong absolute bottom-full left-0 z-[70] mb-1 max-h-[60vh] overflow-y-auto rounded-xl py-1 shadow-[var(--shadow-glass)]">
            {children}
          </div>
        </>
      )}
    </div>
  );
}

export function PptConfig({ pages, size, template, onPagesChange, onSizeChange, onTemplateChange }: PptConfigProps) {
  const [open, setOpen] = useState<Open>(null);

  const isAuto = template === PPT_TEMPLATE_AUTO;
  const tpl = PPT_TEMPLATES.find((t) => t.id === template) ?? PPT_TEMPLATES[0];
  const accent = isAuto ? AUTO_ACCENT : tpl.accent;
  const sz = PPT_SIZES.find((s) => s.id === size) ?? PPT_SIZES[0];
  const isPresetPage = (PAGE_PRESETS as readonly number[]).includes(pages);

  const triggerCls =
    "inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] px-2.5 text-[12px] text-[var(--text-icon-text-2)] backdrop-blur-[12px] transition-colors hover:border-[var(--brand-emerald-200)] hover:bg-[var(--glass-bg-strong)] active:scale-[0.97]";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg-soft)] p-2.5 backdrop-blur-[12px]">
      {/* PPT 标签（强调色；智选用渐变） */}
      <span
        className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-medium text-white"
        style={isAuto ? { background: `linear-gradient(135deg, ${AUTO_ACCENT}, #34d399)` } : { backgroundColor: accent }}
      >
        <Presentation className="h-3.5 w-3.5" strokeWidth={2} />
        PPT
      </span>

      {/* 页数（预设 + 自定义） */}
      <Dropdown
        open={open === "pages"}
        onClose={() => setOpen(null)}
        trigger={
          <button type="button" onClick={() => setOpen(open === "pages" ? null : "pages")} className={triggerCls}>
            <span className="text-[var(--text-icon-text-4)]">页数</span>
            <span className="tabular-nums font-medium text-[var(--brand-brand01-black)]">{pages}</span>
            {!isPresetPage && (
              <span className="rounded bg-[var(--beta-bg)] px-1 text-[9px] leading-tight text-[var(--beta-text)]">自</span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-[var(--text-icon-text-4)]" strokeWidth={2} />
          </button>
        }
      >
        <div className="w-44">
          {PAGE_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                onPagesChange(n);
                setOpen(null);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors hover:bg-[var(--neutral-grey60)] ${
                pages === n ? "text-[var(--brand-brand01-black)]" : "text-[var(--text-icon-text-2)]"
              }`}
            >
              <span className="tabular-nums">{n} 页</span>
              {pages === n && <Check className="h-3.5 w-3.5" strokeWidth={2.5} style={{ color: accent }} />}
            </button>
          ))}
          <div className="my-1 border-t border-[var(--neutral-grey100)]" />
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <span className="text-[12px] text-[var(--text-icon-text-4)]">自定义</span>
            <input
              type="number"
              min={1}
              max={60}
              value={pages}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v)) onPagesChange(Math.max(1, Math.min(60, Math.round(v))));
              }}
              className="tabular-nums h-7 w-16 rounded-md border border-[var(--neutral-grey300)] bg-white px-2 text-[12px] text-[var(--text-icon-text-1)] outline-none focus:border-[var(--brand-brand03-blue)]"
              aria-label="自定义页数"
            />
          </div>
        </div>
      </Dropdown>

      {/* 尺寸 */}
      <Dropdown
        open={open === "size"}
        onClose={() => setOpen(null)}
        trigger={
          <button type="button" onClick={() => setOpen(open === "size" ? null : "size")} className={triggerCls}>
            <span className="text-[var(--text-icon-text-4)]">尺寸</span>
            <span className="font-medium text-[var(--brand-brand01-black)]">{sz.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[var(--text-icon-text-4)]" strokeWidth={2} />
          </button>
        }
      >
        <div className="w-56">
          {PPT_SIZES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onSizeChange(s.id);
                setOpen(null);
              }}
              className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--neutral-grey60)] ${
                s.id === size ? "bg-[var(--neutral-grey60)]" : ""
              }`}
            >
              <span className="mt-0.5 flex h-4 w-4 items-center justify-center">
                {s.id === size && <Check className="h-3.5 w-3.5" strokeWidth={2.5} style={{ color: accent }} />}
              </span>
              <span className="flex-1">
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-icon-text-1)]">
                  {s.name}
                  <span className="tabular-nums text-[10px] text-[var(--text-icon-text-5)]">{s.w}:{s.h}</span>
                  {s.badge && (
                    <span className="rounded bg-[var(--beta-bg)] px-1 text-[9px] leading-tight text-[var(--beta-text)]">{s.badge}</span>
                  )}
                </span>
                <span className="mt-0.5 block text-[11px] text-[var(--text-icon-text-4)]">{s.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </Dropdown>

      {/* 模板（含智选） */}
      <Dropdown
        open={open === "template"}
        onClose={() => setOpen(null)}
        trigger={
          <button type="button" onClick={() => setOpen(open === "template" ? null : "template")} className={triggerCls}>
            <span
              className="h-3 w-3 rounded-full"
              style={isAuto ? { background: `linear-gradient(135deg, ${AUTO_ACCENT}, #34d399)` } : { backgroundColor: tpl.accent }}
              aria-hidden
            />
            <span className="text-[var(--text-icon-text-4)]">模板</span>
            <span className="font-medium text-[var(--brand-brand01-black)]">{isAuto ? "智选" : tpl.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[var(--text-icon-text-4)]" strokeWidth={2} />
          </button>
        }
      >
        <div className="w-60">
          {/* 智选 */}
          <button
            type="button"
            onClick={() => {
              onTemplateChange(PPT_TEMPLATE_AUTO);
              setOpen(null);
            }}
            className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--neutral-grey60)] ${
              isAuto ? "bg-[var(--neutral-grey60)]" : ""
            }`}
          >
            <span
              className="mt-0.5 h-4 w-4 shrink-0 rounded-md"
              style={{ background: `linear-gradient(135deg, ${AUTO_ACCENT}, #34d399)` }}
              aria-hidden
            />
            <span className="flex-1">
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-icon-text-1)]">
                <Sparkles className="h-3 w-3" strokeWidth={2.5} style={{ color: AUTO_ACCENT }} />
                智选
                <span className="rounded bg-[var(--beta-bg)] px-1 text-[9px] leading-tight text-[var(--beta-text)]">推荐</span>
              </span>
              <span className="mt-0.5 block text-[11px] text-[var(--text-icon-text-4)]">由编排引擎自动决定风格，不受模板约束</span>
            </span>
            {isAuto && <Check className="mt-1 h-3.5 w-3.5 shrink-0" strokeWidth={2.5} style={{ color: AUTO_ACCENT }} />}
          </button>
          <div className="my-1 border-t border-[var(--neutral-grey100)]" />
          {PPT_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onTemplateChange(t.id);
                setOpen(null);
              }}
              className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--neutral-grey60)] ${
                t.id === template ? "bg-[var(--neutral-grey60)]" : ""
              }`}
            >
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-md border border-black/10" style={{ backgroundColor: t.accent }} aria-hidden />
              <span className="flex-1">
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-icon-text-1)]">
                  {t.name}
                  {t.dark && <span className="rounded bg-[var(--neutral-grey800)] px-1 text-[9px] leading-tight text-white">深色</span>}
                </span>
                <span className="mt-0.5 block text-[11px] text-[var(--text-icon-text-4)]">{t.desc}</span>
              </span>
              {t.id === template && <Check className="mt-1 h-3.5 w-3.5 shrink-0" strokeWidth={2.5} style={{ color: accent }} />}
            </button>
          ))}
        </div>
      </Dropdown>
    </div>
  );
}
