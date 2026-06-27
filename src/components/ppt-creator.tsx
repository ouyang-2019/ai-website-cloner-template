"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { PPT_TEMPLATES, PPT_SIZES, type PptTemplate, type PptSize } from "@/data/ppt";
import { generateDeck, PAGE_TYPE_LABELS, type PptPage } from "@/lib/ppt-generator";
import { useCredits } from "@/components/credits/credits-provider";
import { CreditLockPanel } from "@/components/credits/credit-lock-panel";
import { getTaskCost } from "@/lib/credits";
import { estimateCredits, openSse } from "@/lib/api";
import type { CreditEstimate } from "@/types/credits";

const PPT_COST = getTaskCost("artifact-publish", "heavy");

function localPptCreditLock(available: number): CreditEstimate {
  return {
    allowed: false,
    lock: true,
    verdict: "blocked",
    low: PPT_COST,
    high: PPT_COST,
    unavailable: false,
    available,
    balance: available,
    reachableRounds: 0,
    topupNeeded: Math.max(0, PPT_COST - available),
    shortfall: Math.max(0, PPT_COST - available),
    capability: "artifact-publish",
    complexity: "heavy",
    note: "PPT 生成积分不足，请先充值或升级订阅。",
    rechargeUrl: "/pricing?intent=recharge",
    upgradeUrl: "/pricing?intent=upgrade",
  };
}

/** 模板迷你预览（用模板配色画出 slide 草图）。 */
function TemplateThumb({ t }: { t: PptTemplate }) {
  return (
    <div className="flex aspect-[16/10] flex-col justify-center gap-1.5 rounded-lg p-3" style={{ background: t.bg }}>
      <div className="h-1 w-7 rounded-full" style={{ background: t.accent }} />
      <div className="h-2 w-3/4 rounded" style={{ background: t.text, opacity: 0.85 }} />
      <div className="h-1.5 w-1/2 rounded" style={{ background: t.muted }} />
      <div className="mt-1 flex gap-1">
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: t.accent }} />
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: t.muted, opacity: 0.5 }} />
      </div>
    </div>
  );
}

/** 尺寸比例预览框。 */
function SizeThumb({ s, accent }: { s: PptSize; accent: string }) {
  return (
    <div className="flex h-16 items-center justify-center">
      <div
        className="rounded border-2"
        style={{ aspectRatio: `${s.w} / ${s.h}`, borderColor: accent, width: s.w >= s.h ? 56 : (56 * s.w) / s.h, height: s.h > s.w ? 56 : (56 * s.h) / s.w, maxWidth: 56, maxHeight: 56 }}
      />
    </div>
  );
}

export function PptCreator() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tpl, setTpl] = useState<PptTemplate>(PPT_TEMPLATES[0]);
  const [size, setSize] = useState<PptSize>(PPT_SIZES[0]);
  const [theme, setTheme] = useState("");
  const [pages, setPages] = useState<PptPage[]>([]);
  const [visible, setVisible] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [active, setActive] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [creditLock, setCreditLock] = useState<CreditEstimate | null>(null);
  const { spend, balance, showToast } = useCredits();

  // 流式逐页显现（模拟 generate_ppt_html_pages 的流式 HTML 交付）
  useEffect(() => {
    if (streaming) return;
    if (!generating) return;
    if (pages.length === 0 || visible >= pages.length) return;

    const currentPage = visible;
    const nextVisible = Math.min(visible + 1, pages.length);
    const t = setTimeout(() => {
      setActive(currentPage);
      setVisible(nextVisible);
      if (nextVisible >= pages.length) {
        setGenerating(false);
        showToast(`PPT 已生成 · 共 ${pages.length} 页 · 消耗 ${PPT_COST} 积分`, "info");
      }
    }, 480);
    return () => clearTimeout(t);
  }, [generating, streaming, visible, pages.length, showToast]);

  const generate = async () => {
    const t = theme.trim();
    if (!t) return;
    if (generating || estimating) return;
    setCreditLock(null);
    setEstimating(true);
    try {
      const estimate = await estimateCredits({
        capability: "artifact-publish",
        complexity: "heavy",
        expectedRounds: 1,
      });
      if (estimate.lock || !estimate.allowed) {
        setCreditLock(estimate);
        setEstimating(false);
        return;
      }
    } catch {
      // Keep local design/demo mode usable without an authenticated backend.
    }
    setEstimating(false);
    if (!spend(PPT_COST, `PPT 生成 · ${t}`)) {
      setCreditLock(localPptCreditLock(balance));
      return;
    }
    setVisible(0);
    setActive(0);
    setGenerating(true);
    setStreaming(true);
    setDownloadUrl(null);
    setStep(3);

    try {
      const streamed: PptPage[] = [];
      await openSse(
        "/ppt/generate",
        { theme: t, templateId: tpl.id, sizeId: size.id, pages: 6 },
        {
          page: (payload) => {
            const page: PptPage = {
              type: String(payload.type ?? "section") as PptPage["type"],
              title: String(payload.title ?? `${t} · ${streamed.length + 1}`),
              pageNo: Number(payload.pageNo ?? streamed.length + 1),
              total: Number(payload.total ?? 6),
              html: String(payload.html ?? ""),
            };
            streamed.push(page);
            setPages([...streamed]);
            setVisible(streamed.length);
            setActive(streamed.length - 1);
          },
          done: (payload) => {
            setDownloadUrl(payload.downloadUrl ? String(payload.downloadUrl) : null);
            setGenerating(false);
            setStreaming(false);
            showToast(`PPT 已生成 · 共 ${streamed.length} 页 · 消耗 ${PPT_COST} 积分`, "info");
          },
        }
      );
      setGenerating(false);
      setStreaming(false);
      return;
    } catch {
      setStreaming(false);
      setPages(generateDeck(t, tpl, size));
      setVisible(0);
      setActive(0);
      setGenerating(true);
    }
  };

  const reset = () => {
    setPages([]);
    setVisible(0);
    setGenerating(false);
    setStreaming(false);
    setActive(0);
    setDownloadUrl(null);
  };

  const STEPS = [
    { n: 1, label: "选模板" },
    { n: 2, label: "选尺寸" },
    { n: 3, label: "生成" },
  ] as const;

  if (creditLock) {
    return <CreditLockPanel estimate={creditLock} feature="PPT 生成" />;
  }

  return (
    <div>
      {/* Title + step indicator */}
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-[22px] font-bold text-[var(--brand-brand01-black)]">
          <Sparkles className="h-5 w-5 text-[var(--brand-brand03-blue)]" strokeWidth={2} />
          PPT 创作
        </h1>
        <span className="rounded-full border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] px-2.5 py-1 text-[11px] text-[var(--text-icon-text-4)] backdrop-blur-[12px]">
          每页流式生成 · 下载时平台转 .pptx · {PPT_COST} 积分/次
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition-colors ${
                step >= s.n ? "text-white" : "bg-[var(--neutral-grey100)] text-[var(--text-icon-text-4)]"
              }`}
              style={step >= s.n ? { backgroundColor: tpl.accent } : undefined}
            >
              {step > s.n ? <Check className="h-4 w-4" strokeWidth={3} /> : s.n}
            </div>
            <span className={`text-[13px] font-medium ${step >= s.n ? "text-[var(--brand-brand01-black)]" : "text-[var(--text-icon-text-4)]"}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-[var(--neutral-grey200)]" />}
          </div>
        ))}
      </div>

      {/* Step 1: template */}
      {step === 1 && (
        <div className="mt-6">
          <p className="text-[14px] font-medium text-[var(--brand-brand01-black)]">选择模板风格</p>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {PPT_TEMPLATES.map((t) => {
              const on = tpl.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTpl(t)}
                  className={`overflow-hidden rounded-xl border bg-[var(--glass-bg)] p-2 text-left backdrop-blur-[18px] saturate-150 transition-all ${
                    on ? "border-2 shadow-[var(--shadow-glass)]" : "border-[var(--glass-border-subtle)] hover:border-[var(--brand-emerald-200)]"
                  }`}
                  style={on ? { borderColor: t.accent } : undefined}
                >
                  <TemplateThumb t={t} />
                  <div className="mt-2 flex items-center gap-1.5 px-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.accent }} />
                    <span className="text-[13px] font-medium text-[var(--brand-brand01-black)]">{t.name}</span>
                  </div>
                  <p className="mt-0.5 px-1 text-[11px] leading-[15px] text-[var(--text-icon-text-4)]">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: size */}
      {step === 2 && (
        <div className="mt-6">
          <p className="text-[14px] font-medium text-[var(--brand-brand01-black)]">选择页面尺寸</p>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {PPT_SIZES.map((s) => {
              const on = size.id === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`rounded-xl border bg-[var(--glass-bg)] p-4 text-left backdrop-blur-[18px] saturate-150 transition-all ${
                    on ? "border-2 shadow-[var(--shadow-glass)]" : "border-[var(--glass-border-subtle)] hover:border-[var(--brand-emerald-200)]"
                  }`}
                  style={on ? { borderColor: tpl.accent } : undefined}
                >
                  <SizeThumb s={s} accent={on ? tpl.accent : "#cbd5e1"} />
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-[var(--brand-brand01-black)]">{s.name}</span>
                    {s.badge && (
                      <span className="rounded bg-[var(--brand-brand04-green)]/15 px-1 text-[9px] font-semibold text-[#00a18b]">
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-[15px] text-[var(--text-icon-text-4)]">{s.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step navigation (step 1/2) */}
      {step < 3 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2) : s))}
            disabled={step === 1}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--neutral-grey300)] bg-white px-4 py-2 text-[13px] text-[var(--text-icon-text-3)] transition-opacity disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} /> 上一步
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => (s < 3 ? ((s + 1) as 2 | 3) : s))}
            className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: tpl.accent }}
          >
            {step === 1 ? "下一步：选尺寸" : "下一步：生成"} <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Step 3: generate + preview */}
      {step === 3 && (
        <div className="mt-6">
          {/* Summary + input */}
          <div className="rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] p-4 shadow-[var(--shadow-card)] backdrop-blur-[18px] saturate-150">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--neutral-grey60)] px-2.5 py-1.5 text-[12px] text-[var(--text-icon-text-2)]"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tpl.accent }} /> 模板：{tpl.name}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--neutral-grey60)] px-2.5 py-1.5 text-[12px] text-[var(--text-icon-text-2)]"
              >
                尺寸：{size.name}
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
                placeholder="输入 PPT 主题，例如：2026 年度产品规划"
                className="h-11 flex-1 rounded-xl border border-[var(--neutral-grey300)] bg-white px-3.5 text-[14px] outline-none transition-colors placeholder:text-[var(--text-icon-text-5)] focus:border-[var(--brand-brand03-blue)]"
              />
              <button
                type="button"
                onClick={generating ? undefined : generate}
                disabled={generating || estimating || !theme.trim()}
                className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[14px] font-medium text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: tpl.accent }}
              >
                {generating || estimating ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} /> : <Sparkles className="h-4 w-4" strokeWidth={2} />}
                {pages.length > 0 && !generating ? "重新生成" : "生成 PPT"}
              </button>
            </div>
          </div>

          {/* Preview */}
          {pages.length > 0 && (
            <div className="mt-5">
              {/* Stage */}
              <div className="overflow-hidden rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg-soft)] p-4 backdrop-blur-[12px]">
                <div
                  className="mx-auto overflow-hidden rounded-xl bg-white shadow-[var(--shadow-card)]"
                  style={{ aspectRatio: `${size.w} / ${size.h}`, width: size.w >= size.h ? "100%" : "auto", maxHeight: "56vh", maxWidth: size.h > size.w ? "min(420px,100%)" : "100%" }}
                >
                  {active < visible ? (
                    <iframe
                      key={active}
                      title={`page-${active + 1}`}
                      srcDoc={pages[active]?.html}
                      sandbox=""
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center gap-2 text-[13px] text-[var(--text-icon-text-4)]">
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} /> 正在生成第 {active + 1} 页…
                    </div>
                  )}
                </div>
              </div>

              {/* Page strip */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {pages.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActive(i)}
                    disabled={i >= visible}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] transition-colors ${
                      active === i
                        ? "border-[var(--brand-brand01-black)] bg-[var(--brand-brand01-black)] text-white"
                        : i >= visible
                        ? "border-[var(--neutral-grey200)] text-[var(--text-icon-text-5)]"
                        : "border-[var(--neutral-grey200)] bg-white text-[var(--text-icon-text-3)] hover:border-[var(--neutral-grey400)]"
                    }`}
                  >
                    <span className="tabular-nums">{i + 1}</span>
                    {PAGE_TYPE_LABELS[p.type]}
                    {i >= visible && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} />}
                  </button>
                ))}
                <span className="ml-auto text-[11px] text-[var(--text-icon-text-5)]">
                  {visible}/{pages.length} 页已生成
                </span>
              </div>

              {/* Actions */}
              {!generating && visible >= pages.length && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (downloadUrl) {
                        window.open(downloadUrl, "_blank", "noopener,noreferrer");
                        return;
                      }
                      showToast("已触发下载（本地演示模式占位）", "info");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-medium text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.97]"
                    style={{ backgroundImage: "var(--gradient-brand)", boxShadow: "var(--shadow-glow-emerald)" }}
                  >
                    <Download className="h-4 w-4" strokeWidth={2} /> 下载 .pptx
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--neutral-grey300)] bg-white px-4 py-2 text-[13px] text-[var(--text-icon-text-3)]"
                  >
                    <RefreshCw className="h-4 w-4" strokeWidth={2} /> 重新生成
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
