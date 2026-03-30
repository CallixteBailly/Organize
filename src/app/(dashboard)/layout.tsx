import type { ReactNode } from "react";
import { Sidebar } from "@/components/layouts/sidebar";
import { MobileNav } from "@/components/layouts/mobile-nav";
import { Topbar } from "@/components/layouts/topbar";
import { AIProvider } from "@/components/ai/ai-provider";
import { ClientFABs } from "@/components/layouts/client-fabs";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const aiEnabled = process.env.AI_ENABLED !== "false";

  return (
    <AIProvider enabled={aiEnabled}>
      <div className="flex h-screen overflow-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:rounded-[var(--radius)] focus:bg-card focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg"
        >
          Aller au contenu principal
        </a>
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main id="main-content" className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
        </div>
        <ClientFABs />
        <MobileNav />
      </div>
    </AIProvider>
  );
}
