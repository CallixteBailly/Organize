import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="Chargement..."
      className={cn("animate-pulse rounded-[var(--radius)] bg-muted", className)}
      {...props}
    >
      <span className="sr-only">Chargement...</span>
    </div>
  );
}
