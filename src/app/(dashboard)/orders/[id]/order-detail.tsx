"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { updateOrderStatusAction } from "@/server/actions/orders";
import { toast } from "sonner";
import { CheckCircle, XCircle, Truck, Package } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  pending: { label: "En attente", variant: "warning" },
  confirmed: { label: "Confirmee", variant: "default" },
  shipped: { label: "Expediee", variant: "default" },
  delivered: { label: "Livree", variant: "success" },
  cancelled: { label: "Annulee", variant: "destructive" },
};

interface OrderItem {
  id: string;
  reference: string;
  name: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  quantityReceived: number;
}

interface Props {
  order: {
    order: {
      id: string;
      orderNumber: string;
      status: string;
      totalHt: string;
      totalTtc: string;
      notes: string | null;
      createdAt: Date;
      expectedDeliveryDate: Date | null;
      deliveredAt: Date | null;
      trackingNumber: string | null;
    };
    supplierName: string;
    items: OrderItem[];
  };
}

export function OrderDetail({ order }: Props) {
  const { order: o, supplierName, items } = order;
  const status = statusConfig[o.status] ?? statusConfig.draft;

  async function handleStatusChange(newStatus: "confirmed" | "shipped" | "delivered" | "cancelled") {
    const result = await updateOrderStatusAction(o.id, newStatus);
    if (result.success) toast.success("Statut mis a jour");
    else toast.error(result.error ?? "Erreur");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informations</CardTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div><span className="text-muted-foreground">Fournisseur:</span> {supplierName}</div>
          <div><span className="text-muted-foreground">Date:</span> {formatDate(o.createdAt)}</div>
          <div><span className="text-muted-foreground">Total HT:</span> {formatCurrency(o.totalHt)}</div>
          <div><span className="text-muted-foreground">Total TTC:</span> <strong>{formatCurrency(o.totalTtc)}</strong></div>
          {o.trackingNumber && <div><span className="text-muted-foreground">Tracking:</span> {o.trackingNumber}</div>}
          {o.expectedDeliveryDate && <div><span className="text-muted-foreground">Livraison prevue:</span> {formatDate(o.expectedDeliveryDate)}</div>}
          {o.deliveredAt && <div><span className="text-muted-foreground">Livre le:</span> {formatDate(o.deliveredAt)}</div>}
          {o.notes && <div className="col-span-2"><span className="text-muted-foreground">Notes:</span> {o.notes}</div>}
        </CardContent>
      </Card>

      {/* Actions */}
      {!["delivered", "cancelled"].includes(o.status) && (
        <div className="flex flex-wrap gap-2">
          {o.status === "pending" && (
            <Button onClick={() => handleStatusChange("confirmed")}>
              <CheckCircle className="h-4 w-4" /> Confirmer
            </Button>
          )}
          {o.status === "confirmed" && (
            <Button onClick={() => handleStatusChange("shipped")}>
              <Truck className="h-4 w-4" /> Marquer expediee
            </Button>
          )}
          {["confirmed", "shipped"].includes(o.status) && (
            <Button variant="outline" onClick={() => handleStatusChange("delivered")}>
              <Package className="h-4 w-4" /> Marquer livree
            </Button>
          )}
          {!["delivered", "cancelled"].includes(o.status) && (
            <Button variant="destructive" onClick={() => handleStatusChange("cancelled")}>
              <XCircle className="h-4 w-4" /> Annuler
            </Button>
          )}
        </div>
      )}

      {/* Lignes */}
      <Card>
        <CardHeader>
          <CardTitle>Articles commandes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 rounded-[var(--radius)] border border-border p-3">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{item.reference}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                  <p className="font-bold">{formatCurrency(item.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
