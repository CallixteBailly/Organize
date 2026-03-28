"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { AuthProvider } from "./auth-provider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </QueryProvider>
    </AuthProvider>
  );
}
