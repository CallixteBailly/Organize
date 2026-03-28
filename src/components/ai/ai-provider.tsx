"use client";

import { createContext, useContext, type ReactNode } from "react";

interface AIContextValue {
  isEnabled: boolean;
}

const AIContext = createContext<AIContextValue>({ isEnabled: true });

export function AIProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <AIContext value={{ isEnabled: enabled }}>{children}</AIContext>;
}

export function useAI() {
  return useContext(AIContext);
}
