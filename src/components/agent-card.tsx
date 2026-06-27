import Link from "next/link";
import Image from "next/image";
import { Star, Zap } from "lucide-react";
import type { TemplateCard } from "@/types";
import { AgentTierBadge } from "@/components/credits/agent-tier-badge";
import { getAgentRunCost } from "@/lib/credits";
import { categoryMeta } from "@/lib/agents";

/** Reusable agent card — cover + tier badge + category chip + tagline + cost; links to detail. */
export function AgentCard({ id, card }: { id: number; card: TemplateCard }) {
  const meta = categoryMeta(card.category);
  const cost = getAgentRunCost(card);
  return (
    <Link
      href={`/agents/${id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] shadow-[var(--shadow-card)] backdrop-blur-[18px] saturate-150 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-emerald-200)] hover:shadow-[var(--shadow-glass)]"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--neutral-grey100)]">
        <Image
          src={card.cover}
          alt={card.title}
          fill
          sizes="(max-width: 768px) 50vw, 240px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {card.minTier && (
          <div className="absolute left-2 top-2">
            <AgentTierBadge plan={card.minTier} />
          </div>
        )}
        {/* Category chip (accent-colored, real classification) */}
        <span
          className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium backdrop-blur"
          style={{ color: meta.accent }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.accent }} />
          {meta.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-1 text-[14px] font-medium text-[var(--brand-brand01-black)]">{card.title}</p>
        <p className="mt-1 line-clamp-2 text-[11px] leading-[16px] text-[var(--text-icon-text-4)]">{card.tagline}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[var(--text-icon-text-4)]">
          <span className="inline-flex items-center gap-0.5">
            <Star className="h-3 w-3" strokeWidth={2} /> 4.8
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Zap className="h-3 w-3" strokeWidth={2} /> {cost}
          </span>
        </div>
      </div>
    </Link>
  );
}
