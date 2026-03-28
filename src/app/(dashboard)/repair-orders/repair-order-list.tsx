"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Wrench, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  pending: { label: "En attente", variant: "warning" },
  approved: { label: "Approuve", variant: "default" },
  in_progress: { label: "En cours", variant: "default" },
  completed: { label: "Termine", variant: "success" },
  invoiced: { label: "Facture", variant: "success" },
  cancelled: { label: "Annule", variant: "destructive" },
};

interface RepairOrder {
  repairOrder: {
    id: string;
    repairOrderNumber: string;
    status: string;
    totalTtc: string;
    createdAt: Date;
  };
  customerFirstName: string | null;
  customerLastName: string | null;
  customerCompanyName: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
}

interface Props {
  orders: RepairOrder[];
  page: number;
  totalPages: number;
}

export function RepairOrderList({ orders, page, totalPages }: Props) {
  const router = useRouter();

  function getCustomerName(o: RepairOrder) {
    if (o.customerCompanyName) return o.customerCompanyName;
    return [o.customerFirstName, o.customerLastName].filter(Boolean).join(" ") || "Client";
  }

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Aucune intervention"
          description="Creez votre premier ordre de reparation"
        />
      ) : (
        <div className="space-y-2">
          {orders.map((item) => {
            const { repairOrder: ro } = item;
            const status = statusConfig[ro.status] ?? statusConfig.draft;
            return (
              <Link key={ro.id} href={`/repair-orders/${ro.id}`}>
                <Card className="transition-colors hover:bg-secondary/50">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium font-mono text-foreground">{ro.repairOrderNumber}</p>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getCustomerName(item)} — {item.vehicleBrand} {item.vehicleModel}
                        {item.vehiclePlate && <span className="ml-1 font-mono">({item.vehiclePlate})</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold">{formatCurrency(ro.totalTtc)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(ro.createdAt)}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => router.push(`/repair-orders?page=${page - 1}`)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => router.push(`/repair-orders?page=${page + 1}`)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
