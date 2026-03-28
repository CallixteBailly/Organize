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
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-bold text-foreground">{formatValue(currentValue)}</p>
        <div className="flex items-center gap-2">
          {isNeutral ? (
            <Minus className="h-4 w-4 text-muted-foreground" />
          ) : isPositive ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
          <span
            className={cn(
              "text-sm font-medium",
              isNeutral ? "text-muted-foreground" : isPositive ? "text-success" : "text-destructive",
            )}
          >
            {isPositive ? "+" : ""}{changePercent}%
          </span>
          <span className="text-sm text-muted-foreground">vs N-1 ({formatValue(previousValue)})</span>
        </div>
      </CardContent>
    </Card>
  );
}
