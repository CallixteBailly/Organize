import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  title: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  formatValue?: (v: number) => string;
}

function defaultFormat(v: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);
}

export function ComparisonCard({
  title,
  currentValue,
  previousValue,
  changePercent,
  formatValue = defaultFormat,
}: Props) {
  const isPositive = changePercent > 0;
  const isNeutral = changePercent === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-2xl font-bold tracking-tight text-foreground">{formatValue(currentValue)}</p>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              isNeutral
                ? "bg-secondary text-muted-foreground"
                : isPositive
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive",
            )}
          >
            {isNeutral ? (
              <Minus className="h-3 w-3" aria-hidden="true" />
            ) : isPositive ? (
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-3 w-3" aria-hidden="true" />
            )}
            <span aria-hidden="true">{isPositive ? "+" : ""}{changePercent}%</span>
            <span className="sr-only">{isNeutral ? "Stable" : isPositive ? `En hausse de ${changePercent}%` : `En baisse de ${Math.abs(changePercent)}%`}</span>
          </div>
          <span className="text-xs text-muted-foreground">vs N-1 ({formatValue(previousValue)})</span>
        </div>
      </CardContent>
    </Card>
  );
}
