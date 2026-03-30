import type { ReactNode } from "react";
import { Wrench } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-primary shadow-[var(--shadow-sm)]">
          <Wrench className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-foreground">Organize</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-8 text-xs text-muted-foreground">
        Logiciel de gestion pour garages automobiles
      </p>
    </div>
  );
}
