import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRecentMovements } from "@/server/services/stock.service";
import { PageHeader } from "@/components/layouts/page-header";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, RotateCcw, Package } from "lucide-react";
import { formatDateTime } from "@/lib/utils/format";

const typeConfig: Record<string, { label: string; icon: typeof ArrowUpCircle; color: string }> = {
  entry: { label: "Entree", icon: ArrowDownCircle, color: "text-success" },
  exit: { label: "Sortie", icon: ArrowUpCircle, color: "text-destructive" },
  adjustment: { label: "Ajustement", icon: RefreshCw, color: "text-warning" },
  return: { label: "Retour", icon: RotateCcw, color: "text-primary" },
};

export default async function MovementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const movements = await getRecentMovements(session.user.garageId, 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mouvements de stock"
        description={`${movements.length} mouvement(s) recents`}
      />

      {movements.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun mouvement"
          description="Les mouvements de stock apparaitront ici"
        />
      ) : (
        <div className="space-y-2">
          {movements.map(({ movement: m, itemName, itemReference, performerFirstName, performerLastName }) => {
            const config = typeConfig[m.type] ?? typeConfig.entry;
            const Icon = config.icon;
            return (
              <Link key={m.id} href={`/stock/${m.stockItemId}`}>
                <Card className="transition-colors hover:bg-secondary/50">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Icon className={`h-5 w-5 shrink-0 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-foreground">{itemName}</p>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-mono">{itemReference}</span>
                        {" — "}
                        {performerFirstName} {performerLastName}
                        {m.reason && ` — ${m.reason}`}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">
                        {m.quantity > 0 ? "+" : ""}{m.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(m.createdAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
