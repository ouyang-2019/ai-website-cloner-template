import { BarChart3, Database, FlaskConical, ShieldCheck } from "lucide-react";
import type { TemplateCard } from "@/types";
import { beautyBarrierProfile } from "@/data/beauty-barrier-agents";

function StatusPill({ status }: { status: "ready" | "gray" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
        status === "ready" ? "bg-[#eff7ef] text-[#376238]" : "bg-[#faf4e5] text-[#8a6418]"
      }`}
    >
      {status === "ready" ? "已纳入高级能力" : "计划推出 · 灰度中"}
    </span>
  );
}

export function BeautyBarrierPanel({ card }: { card: TemplateCard }) {
  const profile = beautyBarrierProfile(card.skillRef);
  if (!profile) return null;

  const warmPanel =
    "rounded-2xl border border-[#e7dfcf] bg-[#fffaf0] p-4 shadow-[0_18px_48px_rgba(86,64,35,0.08)]";

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-[var(--brand-brand01-black)]">行业壁垒交付面板</h2>
          <p className="mt-1 text-[12px] leading-[20px] text-[var(--text-icon-text-4)]">{profile.sourceProject}</p>
        </div>
        <StatusPill status={profile.status} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className={warmPanel}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#b08d3a]" strokeWidth={2.2} />
            <h3 className="text-[14px] font-semibold text-[#2d2a22]">{profile.outputMode}</h3>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {profile.deliverables.map((item) => (
              <div key={item} className="rounded-xl border border-[#eee5d5] bg-white/75 px-3 py-2 text-[12px] text-[#5b5549]">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className={warmPanel}>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-[#1f3a5f]" strokeWidth={2.2} />
            <h3 className="text-[14px] font-semibold text-[#2d2a22]">高并发接入策略</h3>
          </div>
          <p className="mt-3 text-[12px] leading-[22px] text-[#5b5549]">{profile.concurrency}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <div className={warmPanel}>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-[#b08d3a]" strokeWidth={2.2} />
            <h3 className="text-[14px] font-semibold text-[#2d2a22]">执行链</h3>
          </div>
          <div className="mt-3 space-y-2">
            {profile.pipeline.map((step, index) => (
              <div key={step} className="flex gap-2 text-[12px] leading-[20px] text-[#5b5549]">
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[#1f3a5f] text-[10px] font-semibold text-white">
                  {index + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>

        {profile.trendRows && (
          <div className={warmPanel}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#b08d3a]" strokeWidth={2.2} />
                <h3 className="text-[14px] font-semibold text-[#2d2a22]">趋势报告与抓取数据报表</h3>
              </div>
              <span className="text-[11px] text-[#8a887f]">PPT / 自媒体文案不在本智能体输出</span>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-[#eee5d5] bg-white/80">
              <div className="grid grid-cols-[1.6fr_0.9fr_0.9fr_0.7fr_0.7fr_0.8fr] border-b border-[#eee5d5] bg-[#f7f0df] px-3 py-2 text-[11px] font-medium text-[#7a6b42]">
                <span>商品</span><span>品牌</span><span>平台</span><span>价格</span><span>评分</span><span>阶段</span>
              </div>
              {profile.trendRows.map((row) => (
                <div key={`${row.product}-${row.platform}`} className="grid grid-cols-[1.6fr_0.9fr_0.9fr_0.7fr_0.7fr_0.8fr] px-3 py-2 text-[11px] text-[#4e493f]">
                  <span className="font-medium text-[#2d2a22]">{row.product}</span>
                  <span>{row.brand}</span>
                  <span>{row.platform}</span>
                  <span>{row.price}</span>
                  <span>{row.score}</span>
                  <span>{row.lifecycle}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.competitorScores && profile.competitorRows && (
          <div className={warmPanel}>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#b08d3a]" strokeWidth={2.2} />
              <h3 className="text-[14px] font-semibold text-[#2d2a22]">暖色六维背调报告</h3>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {profile.competitorScores.map((score) => (
                <div key={score.label} className="rounded-xl border border-[#eee5d5] bg-white/75 p-3">
                  <div className="flex items-end justify-between">
                    <span className="text-[12px] font-medium text-[#5b5549]">{score.label}</span>
                    <span className="font-mono text-[18px] font-semibold text-[#1f3a5f]">{score.value}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#efe7d5]">
                    <div className="h-full rounded-full bg-[#b08d3a]" style={{ width: `${score.value}%` }} />
                  </div>
                  <p className="mt-2 text-[11px] text-[#8a887f]">{score.note}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-2">
              {profile.competitorRows.map((row) => (
                <div key={row.competitor} className="grid gap-2 rounded-xl border border-[#eee5d5] bg-white/75 p-3 text-[11px] text-[#5b5549] sm:grid-cols-[1.2fr_0.7fr_1fr_1fr]">
                  <span className="font-medium text-[#2d2a22]">{row.competitor}</span>
                  <span>{row.price}</span>
                  <span>{row.signal}</span>
                  <span>{row.risk}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!profile.trendRows && !profile.competitorScores && (
          <div className={warmPanel}>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#b08d3a]" strokeWidth={2.2} />
              <h3 className="text-[14px] font-semibold text-[#2d2a22]">上线边界</h3>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-[#eee5d5] bg-white/75 p-3">
                <p className="text-[11px] font-medium text-[#7a6b42]">运行方式</p>
                <p className="mt-1 text-[12px] leading-[20px] text-[#4e493f]">
                  规则引擎、RAG 索引和外部数据快照先行，LLM 只参与解释、摘要和低确定性草案。
                </p>
              </div>
              <div className="rounded-xl border border-[#eee5d5] bg-white/75 p-3">
                <p className="text-[11px] font-medium text-[#7a6b42]">交付边界</p>
                <p className="mt-1 text-[12px] leading-[20px] text-[#4e493f]">
                  输出 artifact 引用和审计证据；法规、安评、配方类结论保留人工复核入口。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
