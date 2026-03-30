import type { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("flex items-start gap-4", className)}>
      <div className="rounded-lg bg-primary/10 p-2.5">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-card-foreground">{value}</p>
        {trend && (
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              trend.value >= 0 ? "text-success" : "text-destructive",
            )}
          >
            <span aria-hidden="true">
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </span>
            <span className="sr-only">
              {trend.value >= 0 ? "En hausse de" : "En baisse de"} {Math.abs(trend.value)}% {trend.label}
            </span>
          </p>
        )}
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
    </Card>
  );
}
