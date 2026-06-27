import { getPlanConfig } from "@/lib/credits";
import type { SubscriptionPlan } from "@/types/credits";

/**
 * 档位徽章 — shows the minimum plan required for a capability/template.
 * Colored per plan accent. Used on gallery cards and capability lists.
 */
export function AgentTierBadge({
  plan,
  className = "",
}: {
  plan: SubscriptionPlan;
  className?: string;
}) {
  const cfg = getPlanConfig(plan);
  const isFree = plan === "free";
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
        isFree
          ? "bg-[var(--neutral-grey200)] text-[var(--text-icon-text-3)]"
          : "text-white"
      } ${className}`}
      style={isFree ? undefined : { backgroundColor: cfg.accent }}
    >
      {cfg.displayName}
    </span>
  );
}
