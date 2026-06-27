import { Database } from "lucide-react";
import { DATA_SOURCES } from "@/data/data-sources";

/** 一手数据源面板 — 展示 Kimi 数据源体系的 8 个结构化 API 数据源。 */
export function DataSourcePanel() {
  const totalApis = DATA_SOURCES.reduce((sum, ds) => sum + ds.apiCount, 0);
  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-[16px] font-semibold text-[var(--brand-brand01-black)]">
        <Database className="h-4 w-4 text-[var(--brand-brand03-blue)]" strokeWidth={2} />
        可接入一手数据源
      </h2>
      <p className="mt-1 text-[12px] text-[var(--text-icon-text-4)]">
        源自 Kimi 数据源体系 · {DATA_SOURCES.length} 个数据源 · 共 {totalApis} 个结构化 API 端点
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DATA_SOURCES.map((ds) => (
          <div key={ds.key} className="rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] p-3.5 shadow-[var(--shadow-card)] backdrop-blur-[18px] saturate-150 transition-[border-color,box-shadow] hover:border-[var(--brand-emerald-200)] hover:shadow-[var(--shadow-glass)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-[var(--brand-brand01-black)]">{ds.name}</span>
              <span className="rounded-full bg-[var(--neutral-grey100)] px-2 py-0.5 text-[10px] text-[var(--text-icon-text-3)]">
                {ds.domain}
              </span>
            </div>
            <p className="mt-1.5 text-[12px] leading-[18px] text-[var(--text-icon-text-3)]">{ds.desc}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-[var(--brand-brand03-blue)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--brand-brand03-blue)]">
                {ds.apiCount} API
              </span>
              {ds.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded bg-[var(--neutral-grey60)] px-1.5 py-0.5 text-[10px] text-[var(--text-icon-text-4)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
