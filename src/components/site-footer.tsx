/**
 * 页脚 (.fixed.bottom-0, bg main-1, h-32px, pt-6px).
 * Fixed overlay at the bottom of the content scroller.
 * 版权 + 备案 links (京公网安备 / 京ICP备).
 */
export function SiteFooter() {
  return (
    <footer className="bg-[var(--background-main-1)] fixed bottom-0 left-0 z-10 flex h-8 w-full items-start justify-center pt-[6px]">
      <div className="mx-auto flex max-w-[1180px] items-center justify-center gap-2 px-6 text-[12px] text-[var(--text-icon-text-4)]">
        <span>© 2026 AUBEAU · 企业级智能体协作平台</span>
        <span className="text-[var(--neutral-grey400)]">·</span>
        <a href="/pricing" className="transition-colors hover:text-[var(--text-icon-text-2)]">
          定价
        </a>
        <span className="text-[var(--neutral-grey400)]">·</span>
        <a href="#" className="transition-colors hover:text-[var(--text-icon-text-2)]">
          隐私政策
        </a>
        <span className="text-[var(--neutral-grey400)]">·</span>
        <a href="#" className="transition-colors hover:text-[var(--text-icon-text-2)]">
          服务条款
        </a>
        <span className="text-[var(--neutral-grey400)]">·</span>
        <a href="#" className="transition-colors hover:text-[var(--text-icon-text-2)]">
          帮助中心
        </a>
      </div>
    </footer>
  );
}
