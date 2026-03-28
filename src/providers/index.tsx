"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { AuthProvider } from "./auth-provider";
import { Toaster } from "sonner";
import { OfflineIndicator } from "@/components/ui/offline-indicator";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>
        <OfflineIndicator />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </QueryProvider>
    </AuthProvider>
  );
}
