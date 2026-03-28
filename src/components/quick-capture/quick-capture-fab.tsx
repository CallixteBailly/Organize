"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAI } from "@/components/ai/ai-provider";
import { QuickCaptureSheet } from "./quick-capture-sheet";

export function QuickCaptureFAB() {
  const [open, setOpen] = useState(false);
  const { isEnabled } = useAI();

  if (!isEnabled) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Saisie rapide"
        className={cn(
          "fixed bottom-20 right-4 z-40 lg:bottom-6 lg:right-6",
          "flex h-14 w-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg",
          "transition-transform active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
      >
        <Zap className="h-6 w-6" />
      </button>

      <QuickCaptureSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
