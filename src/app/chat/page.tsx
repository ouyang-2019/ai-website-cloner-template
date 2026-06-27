"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PROJECTS } from "@/data/projects";

/**
 * /chat 已迁移为项目级会话（/projects/[id]）。
 * 此路由保留向后兼容：重定向到默认活跃项目，并透传 agent/skill 查询参数。
 */
function ChatRedirectInner() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const target = PROJECTS.find((p) => p.status === "active") ?? PROJECTS[0];
    const q = new URLSearchParams();
    const agent = sp.get("agent");
    const skill = sp.get("skill");
    if (agent) q.set("agent", agent);
    if (skill) q.set("skill", skill);
    const qs = q.toString();
    router.replace(`/projects/${target.id}${qs ? `?${qs}` : ""}`);
  }, [router, sp]);

  return null;
}

export default function ChatRedirectPage() {
  return (
    <Suspense fallback={null}>
      <ChatRedirectInner />
    </Suspense>
  );
}
