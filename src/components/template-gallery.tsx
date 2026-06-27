"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TEMPLATE_CARDS } from "@/data/content";
import { AgentTierBadge } from "@/components/credits/agent-tier-badge";

const PAGE_SIZE = 24;

/** Single agent-template card — cover (3:4) + tier badge; links to detail page. */
function TemplateCardItem({ card, id }: { card: (typeof TEMPLATE_CARDS)[number]; id: number }) {
  return (
    <Link
      href={`/agents/${id}`}
      className="group relative flex w-full cursor-pointer flex-col rounded-[24px] border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] p-3 backdrop-blur-[18px] saturate-150 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-emerald-200)] hover:shadow-[var(--shadow-glass)]"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[var(--neutral-grey100)]">
        <Image
          src={card.cover}
          alt={card.title}
          fill
          sizes="(max-width: 1380px) 300px, 266px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {card.minTier && (
          <div className="absolute left-2 top-2">
            <AgentTierBadge plan={card.minTier} />
          </div>
        )}
        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/30 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="rounded-full bg-white px-3 py-1 text-[13px] font-medium text-[var(--brand-brand01-black)] shadow">
            查看详情
          </span>
        </div>
      </div>
      <p className="line-clamp-2 mt-3 overflow-hidden text-ellipsis text-[15px] font-medium leading-[22px] text-[var(--brand-brand01-black)]">
        {card.title}
      </p>
    </Link>
  );
}

/** 热门智能体 gallery — header + waterfall masonry with infinite scroll. */
export function TemplateGallery() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (visibleCount >= TEMPLATE_CARDS.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, TEMPLATE_CARDS.length));
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visibleCount]);

  return (
    <section className="w-full flex-1 px-6 pb-12">
      <div className="mb-4 flex items-center justify-between px-0">
        <h2 className="cursor-pointer text-[18px] font-medium text-[var(--brand-brand01-black)]">
          热门智能体
        </h2>
        <Link href="/explore" className="text-[12px] text-[var(--text-icon-text-5)] transition-colors hover:text-[var(--text-icon-text-2)]">
          探索全部 →
        </Link>
      </div>
      <div className="waterfall">
        {TEMPLATE_CARDS.slice(0, visibleCount).map((card, i) => (
          <TemplateCardItem key={card.title} card={card} id={i + 1} />
        ))}
      </div>
      {visibleCount < TEMPLATE_CARDS.length && (
        <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
      )}
    </section>
  );
}
