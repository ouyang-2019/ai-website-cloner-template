import { AppShell } from "@/components/app-shell";
import { AgentHero } from "@/components/agent-hero";
import { TemplateGallery } from "@/components/template-gallery";
import { HomePromoBanner } from "@/components/promo-banner";

/**
 * AUBEAU 工作台首页 — 全宽促销条（倒计时 + 跳转订阅）+ 中央问候 + 热门画廊。
 */
export default function Home() {
  return (
    <AppShell>
      <div className="scrollbar-hide bg-homepage relative flex h-full flex-col overflow-auto rounded-tl-[20px] rounded-tr-[20px] pb-[60px]">
        {/* 全宽促销广告栏：倒计时 + 立即抢购跳转 /pricing（下移 12px 避开顶部导航） */}
        <HomePromoBanner className="mt-3" />
        <div className="flex min-h-full w-full flex-col items-center">
          <AgentHero />
          <TemplateGallery />
        </div>
      </div>
    </AppShell>
  );
}
