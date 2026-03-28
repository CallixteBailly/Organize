"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  pending: { label: "En attente", variant: "warning" },
  confirmed: { label: "Confirmee", variant: "default" },
  shipped: { label: "Expediee", variant: "default" },
  delivered: { label: "Livree", variant: "success" },
  cancelled: { label: "Annulee", variant: "destructive" },
};

interface Order {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    totalTtc: string;
    createdAt: Date;
    expectedDeliveryDate: Date | null;
  };
  supplierName: string;
}

interface Props {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

export function OrderList({ orders, total, page, totalPages }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Aucune commande"
          description="Vos commandes fournisseurs apparaitront ici"
        />
      ) : (
        <div className="space-y-2">
          {orders.map(({ order, supplierName }) => {
            const status = statusConfig[order.status] ?? statusConfig.draft;
            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="transition-colors hover:bg-secondary/50">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground font-mono">{order.orderNumber}</p>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {supplierName} — {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground">{formatCurrency(order.totalTtc)}</p>
                      {order.expectedDeliveryDate && (
                        <p className="text-xs text-muted-foreground">
                          Livraison: {formatDate(order.expectedDeliveryDate)}
                        </p>
                      )}
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
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => router.push(`/orders?page=${page - 1}`)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => router.push(`/orders?page=${page + 1}`)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
