import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";

interface Alert {
  type: string;
  severity: "warning" | "critical";
  message: string;
  link: string;
}

interface Props {
  alerts: Alert[];
}

export function AlertList({ alerts }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertes</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="Aucune alerte"
            description="Tout est en ordre"
            className="py-4"
          />
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <Link key={i} href={alert.link}>
                <div className="flex items-center gap-3 rounded-[var(--radius)] border border-border p-3 transition-colors hover:bg-secondary/50">
                  <AlertTriangle
                    className={`h-5 w-5 shrink-0 ${
                      alert.severity === "critical" ? "text-destructive" : "text-warning"
                    }`}
                  />
                  <span className="flex-1 text-sm">{alert.message}</span>
                  <Badge variant={alert.severity === "critical" ? "destructive" : "warning"}>
                    {alert.severity === "critical" ? "Critique" : "Attention"}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
