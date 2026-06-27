import { AppShell } from "@/components/app-shell";
import { PptCreator } from "@/components/ppt-creator";

export default function PptCreatePage() {
  return (
    <AppShell>
      <div className="scrollbar-hide bg-homepage flex-1 overflow-auto">
        <div className="mx-auto max-w-[1100px] px-6 py-6">
          <PptCreator />
        </div>
      </div>
    </AppShell>
  );
}
