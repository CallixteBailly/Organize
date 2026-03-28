import type { ReactNode } from "react";
import { Sidebar } from "@/components/layouts/sidebar";
import { MobileNav } from "@/components/layouts/mobile-nav";
import { Topbar } from "@/components/layouts/topbar";
import { AIProvider } from "@/components/ai/ai-provider";
import { QuickCaptureFAB } from "@/components/quick-capture";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const aiEnabled = process.env.AI_ENABLED !== "false";

  return (
    <AIProvider enabled={aiEnabled}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
        </div>
        <QuickCaptureFAB />
        <MobileNav />
      </div>
    </AIProvider>
  );
}
