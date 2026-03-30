"use client";

import { useState } from "react";
import { usePathname, useParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAI } from "@/components/ai/ai-provider";
import { ChatPanel } from "./chat-panel";
import type { PageContext } from "@/lib/ai/chat/types";

function resolvePageContext(pathname: string, params: Record<string, string | string[]>): PageContext | undefined {
  if (!pathname) return undefined;

  // Détecter le type d'entité depuis le pathname
  const entityPatterns: Array<{
    pattern: RegExp;
    entityType: PageContext["entityType"];
    paramKey: string;
  }> = [
    { pattern: /^\/repair-orders\/([^/]+)$/, entityType: "repair_order", paramKey: "id" },
    { pattern: /^\/customers\/([^/]+)$/, entityType: "customer", paramKey: "id" },
    { pattern: /^\/vehicles\/([^/]+)$/, entityType: "vehicle", paramKey: "id" },
    { pattern: /^\/quotes\/([^/]+)$/, entityType: "quote", paramKey: "id" },
    { pattern: /^\/invoices\/([^/]+)$/, entityType: "invoice", paramKey: "id" },
    { pattern: /^\/stock\/([^/]+)$/, entityType: "stock_item", paramKey: "id" },
  ];

  for (const { pattern, entityType } of entityPatterns) {
    const match = pathname.match(pattern);
    if (match) {
      const entityId = typeof params.id === "string" ? params.id : undefined;
      return { route: pathname, entityType, entityId };
    }
  }

  return { route: pathname };
}

export function ChatFAB() {
  const [open, setOpen] = useState(false);
  const { isEnabled } = useAI();
  const pathname = usePathname();
  const params = useParams() as Record<string, string | string[]>;

  if (!isEnabled) return null;

  const pageContext = resolvePageContext(pathname, params);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir l'assistant IA"
        className={cn(
          // Mobile : au-dessus de la navigation mobile
          "fixed bottom-20 right-4 z-40",
          // Desktop : coin bas-droit standard
          "lg:bottom-6 lg:right-6",
          "flex h-14 w-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg",
          "transition-transform active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
      >
        <Sparkles className="h-6 w-6" />
      </button>

      <ChatPanel
        open={open}
        onClose={() => setOpen(false)}
        pageContext={pageContext}
      />
    </>
  );
}
