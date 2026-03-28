import type { ReactNode } from "react";
import { Wrench } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-2">
        <Wrench className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold text-foreground">Organize</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
