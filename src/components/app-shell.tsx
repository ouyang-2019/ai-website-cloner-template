import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { Sidebar } from "./sidebar";
import { ImFab } from "./im-fab";

/**
 * 共享应用外壳 — header (54px) + main[sidebar 290px | content slot] + footer + 全局 IM 悬浮按钮。
 * 各页面把内容作为 children 传入；首页用 bg-homepage 滚动器，其它页用普通容器。
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex h-[calc(100vh-54px)] w-full overflow-x-auto overflow-y-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </main>
      <SiteFooter />
      <ImFab />
    </>
  );
}
