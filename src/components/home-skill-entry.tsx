import Link from "next/link";
import { Sparkles, FileText, Table, Globe, Video, Image as ImageIcon, Presentation, ArrowRight } from "lucide-react";
import { SKILLS } from "@/data/skills";

/** 首页"快速创建"技能快捷栏 — PPT 等关键技能一键进入创作流。 */
const FEATURED = ["ppt", "doc", "sheet", "website", "video", "image"] as const;
const ICON_MAP = {
  ppt: Presentation,
  doc: FileText,
  sheet: Table,
  website: Globe,
  video: Video,
  image: ImageIcon,
} as const;

export function HomeSkillEntry() {
  const items = FEATURED.map((id) => SKILLS.find((s) => s.id === id)).filter(Boolean) as NonNullable<
    ReturnType<typeof SKILLS.find>
  >[];

  return (
    <section className="mx-auto w-full max-w-[1100px] px-6 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold text-[var(--brand-brand01-black)]">
          <Sparkles className="h-4 w-4 text-[var(--brand-brand03-blue)]" strokeWidth={2} />
          快速创建 · 选择技能
        </h2>
        <Link
          href="/skills"
          className="inline-flex items-center gap-1 text-[12px] text-[var(--text-icon-text-4)] hover:text-[var(--text-icon-text-2)]"
        >
          全部技能 <ArrowRight className="h-3 w-3" strokeWidth={2} />
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((s) => {
          const isPpt = s.id === "ppt";
          const Icon = ICON_MAP[s.id as keyof typeof ICON_MAP];
          return (
            <Link
              key={s.id}
              href={s.href}
              className={`group relative flex flex-col gap-2 overflow-hidden rounded-xl border p-3 transition-all ${
                isPpt
                  ? "border-transparent text-white"
                  : "border-[var(--neutral-grey200)] bg-white hover:border-[var(--neutral-grey400)] hover:shadow-[var(--shadow-card)]"
              }`}
              style={isPpt ? { background: "linear-gradient(135deg,#10b981 0%,#34d399 100%)" } : undefined}
            >
              {s.badge && !isPpt && (
                <span className="absolute right-2 top-2 rounded-full bg-[#ff576d] px-1.5 py-0.5 text-[9px] font-semibold text-white">
                  {s.badge}
                </span>
              )}
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  isPpt ? "bg-white/20" : "bg-[var(--neutral-grey60)]"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <div className="text-[13px] font-semibold">{s.name}</div>
                <div
                  className={`mt-0.5 line-clamp-1 text-[11px] ${
                    isPpt ? "text-white/80" : "text-[var(--text-icon-text-4)]"
                  }`}
                >
                  {s.desc}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
