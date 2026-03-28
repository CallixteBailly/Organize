import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLowStockAlerts } from "@/server/services/stock.service";
import { PageHeader } from "@/components/layouts/page-header";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

export default async function StockAlertsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const alerts = await getLowStockAlerts(session.user.garageId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertes stock"
        description={`${alerts.length} article(s) sous le seuil minimum`}
      />

      {alerts.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Aucune alerte"
          description="Tous vos articles sont au-dessus du seuil minimum"
        />
      ) : (
        <div className="space-y-2">
          {alerts.map((item) => (
            <Link key={item.id} href={`/stock/${item.id}`}>
              <Card className="transition-colors hover:bg-secondary/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Ref: {item.reference}
                      {item.brand && ` — ${item.brand}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.quantity <= 0 ? "destructive" : "warning"}>
                        {item.quantity} / {item.minQuantity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(item.sellingPrice)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
