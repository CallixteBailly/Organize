"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  RotateCcw,
  Plus,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { RecordMovementDialog } from "./record-movement-dialog";

interface StockItem {
  id: string;
  reference: string;
  barcode: string | null;
  oemReference: string | null;
  name: string;
  brand: string | null;
  purchasePrice: string | null;
  sellingPrice: string;
  vatRate: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number | null;
  location: string | null;
  unit: string;
}

interface Movement {
  movement: {
    id: string;
    type: string;
    quantity: number;
    unitPrice: string | null;
    reason: string | null;
    createdAt: Date;
  };
  performerFirstName: string;
  performerLastName: string;
}

interface Props {
  item: StockItem;
  movements: Movement[];
}

const typeConfig: Record<string, { label: string; icon: typeof ArrowUpCircle; color: string }> = {
  entry: { label: "Entree", icon: ArrowDownCircle, color: "text-success" },
  exit: { label: "Sortie", icon: ArrowUpCircle, color: "text-destructive" },
  adjustment: { label: "Ajustement", icon: RefreshCw, color: "text-warning" },
  return: { label: "Retour", icon: RotateCcw, color: "text-primary" },
};

export function StockItemDetail({ item, movements }: Props) {
  const [showMovement, setShowMovement] = useState(false);
  const isLowStock = item.quantity <= item.minQuantity;

  return (
    <div className="space-y-6">
      {/* Info principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-foreground">{item.quantity}</p>
            <p className="text-sm text-muted-foreground">En stock ({item.unit})</p>
            {isLowStock && <Badge variant="warning" className="mt-1">Stock bas</Badge>}
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-xl font-bold text-foreground">{formatCurrency(item.sellingPrice)}</p>
            <p className="text-sm text-muted-foreground">Prix de vente HT</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-xl font-bold text-foreground">
              {item.purchasePrice ? formatCurrency(item.purchasePrice) : "—"}
            </p>
            <p className="text-sm text-muted-foreground">Prix d&apos;achat</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-xl font-bold text-foreground">{item.vatRate}%</p>
            <p className="text-sm text-muted-foreground">TVA</p>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Reference :</span> <span className="font-mono">{item.reference}</span></div>
          {item.barcode && <div><span className="text-muted-foreground">Code-barres :</span> <span className="font-mono">{item.barcode}</span></div>}
          {item.oemReference && <div><span className="text-muted-foreground">Ref. OEM :</span> {item.oemReference}</div>}
          {item.brand && <div><span className="text-muted-foreground">Marque :</span> {item.brand}</div>}
          {item.location && <div><span className="text-muted-foreground">Emplacement :</span> {item.location}</div>}
          <div><span className="text-muted-foreground">Seuil min :</span> {item.minQuantity}</div>
          {item.maxQuantity && <div><span className="text-muted-foreground">Seuil max :</span> {item.maxQuantity}</div>}
        </CardContent>
      </Card>

      {/* Mouvements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mouvements</CardTitle>
          <Button size="sm" onClick={() => setShowMovement(true)}>
            <Plus className="h-4 w-4" />
            Mouvement
          </Button>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Aucun mouvement"
              description="Les mouvements de stock apparaitront ici"
              className="py-6"
            />
          ) : (
            <div className="space-y-3">
              {movements.map(({ movement: m, performerFirstName, performerLastName }) => {
                const config = typeConfig[m.type] ?? typeConfig.entry;
                const Icon = config.icon;
                return (
                  <div key={m.id} className="flex items-center gap-3 rounded-[var(--radius)] border border-border p-3">
                    <Icon className={`h-5 w-5 ${config.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{config.label}</span>
                        <span className="text-sm font-bold">
                          {m.quantity > 0 ? "+" : ""}{m.quantity} {item.unit}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {performerFirstName} {performerLastName}
                        {m.reason && ` — ${m.reason}`}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(m.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showMovement && (
        <RecordMovementDialog stockItemId={item.id} unit={item.unit} onClose={() => setShowMovement(false)} />
      )}
    </div>
  );
}
