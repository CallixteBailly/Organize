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
        <div className="flex items-center justify-between">
          <CardTitle>Alertes</CardTitle>
          {alerts.length > 0 && (
            <Badge variant={alerts.some((a) => a.severity === "critical") ? "destructive" : "warning"}>
              {alerts.length}
            </Badge>
          )}
        </div>
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
          <ul className="space-y-2" role="list">
            {alerts.map((alert, i) => (
              <li key={i}>
                <Link
                  href={alert.link}
                  className="flex items-center gap-3 rounded-[var(--radius)] border border-border p-3 transition-all duration-150 hover:bg-secondary/50 hover:shadow-[var(--shadow-xs)]"
                >
                  <AlertTriangle
                    className={`h-4 w-4 shrink-0 ${
                      alert.severity === "critical" ? "text-destructive" : "text-warning"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-sm">{alert.message}</span>
                  <Badge variant={alert.severity === "critical" ? "destructive" : "warning"}>
                    {alert.severity === "critical" ? "Critique" : "Attention"}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
