"use client";

import { useActionState, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/format";
import { Plus, Trash2, CheckCircle, List } from "lucide-react";
import {
  addLineAction,
  removeLineAction,
  closeRepairOrderAction,
  type RepairOrderActionState,
} from "@/server/actions/repair-orders";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  pending: { label: "En attente", variant: "warning" },
  approved: { label: "Approuve", variant: "default" },
  in_progress: { label: "En cours", variant: "default" },
  completed: { label: "Termine", variant: "success" },
  invoiced: { label: "Facture", variant: "success" },
  cancelled: { label: "Annule", variant: "destructive" },
};

interface Line {
  id: string;
  type: string;
  description: string;
  reference: string | null;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  discountPercent: string | null;
  totalHt: string;
}

interface Props {
  data: {
    repairOrder: {
      id: string;
      repairOrderNumber: string;
      status: string;
      totalPartsHt: string;
      totalLaborHt: string;
      totalHt: string;
      totalVat: string;
      totalTtc: string;
      customerComplaint: string | null;
      diagnosis: string | null;
      workPerformed: string | null;
      mileageAtIntake: number | null;
    };
    lines: Line[];
    vehiclePlate: string | null;
  };
}

const addLineInitial: RepairOrderActionState = { success: false };

export function RepairOrderDetail({ data }: Props) {
  const { repairOrder: ro, lines } = data;
  const status = statusConfig[ro.status] ?? statusConfig.draft;
  const isEditable = !["completed", "invoiced", "cancelled"].includes(ro.status);

  const [addLineState, addLineFormAction, addLinePending] = useActionState(addLineAction, addLineInitial);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (addLineState.success) toast.success("Ligne ajoutee");
    if (addLineState.error) toast.error(addLineState.error);
  }, [addLineState]);

  async function handleClose() {
    setClosing(true);
    const result = await closeRepairOrderAction(ro.id);
    setClosing(false);
    if (result.success) toast.success("OR cloture — stock mis a jour");
    else toast.error(result.error ?? "Erreur");
  }

  async function handleRemoveLine(lineId: string) {
    const result = await removeLineAction(lineId, ro.id);
    if (result.success) toast.success("Ligne supprimee");
    else toast.error(result.error ?? "Erreur");
  }

  return (
    <div className="space-y-6">
      {/* Totaux */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Pieces HT</p>
            <p className="text-lg font-bold">{formatCurrency(ro.totalPartsHt)}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">MO HT</p>
            <p className="text-lg font-bold">{formatCurrency(ro.totalLaborHt)}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">TVA</p>
            <p className="text-lg font-bold">{formatCurrency(ro.totalVat)}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total TTC</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(ro.totalTtc)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Info + Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={status.variant}>{status.label}</Badge>
        {ro.mileageAtIntake && <span className="text-sm text-muted-foreground">{ro.mileageAtIntake.toLocaleString("fr-FR")} km</span>}
        {data.vehiclePlate && <span className="text-sm font-mono text-muted-foreground">{data.vehiclePlate}</span>}
        <div className="flex-1" />
        {isEditable && (
          <Button onClick={handleClose} disabled={closing}>
            {closing ? <Spinner className="h-4 w-4" /> : <><CheckCircle className="h-4 w-4" /> Cloturer l&apos;OR</>}
          </Button>
        )}
      </div>

      {/* Notes */}
      {(ro.customerComplaint || ro.diagnosis || ro.workPerformed) && (
        <Card>
          <CardContent className="space-y-2 pt-4 text-sm">
            {ro.customerComplaint && <div><strong>Plainte client :</strong> {ro.customerComplaint}</div>}
            {ro.diagnosis && <div><strong>Diagnostic :</strong> {ro.diagnosis}</div>}
            {ro.workPerformed && <div><strong>Travaux realises :</strong> {ro.workPerformed}</div>}
          </CardContent>
        </Card>
      )}

      {/* Lignes */}
      <Card>
        <CardHeader>
          <CardTitle>Lignes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.length === 0 ? (
            <EmptyState icon={List} title="Aucune ligne" description="Ajoutez des pieces ou de la main d'oeuvre" className="py-4" />
          ) : (
            <div className="space-y-2">
              {lines.map((line) => (
                <div key={line.id} className="flex items-center gap-3 rounded-[var(--radius)] border border-border p-3">
                  <Badge variant={line.type === "part" ? "secondary" : line.type === "labor" ? "default" : "outline"}>
                    {line.type === "part" ? "Piece" : line.type === "labor" ? "MO" : "Autre"}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{line.description}</p>
                    {line.reference && <p className="text-xs text-muted-foreground font-mono">{line.reference}</p>}
                  </div>
                  <div className="text-right text-sm shrink-0">
                    <p>{line.quantity} x {formatCurrency(line.unitPrice)}</p>
                    <p className="font-bold">{formatCurrency(line.totalHt)} HT</p>
                  </div>
                  {isEditable && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveLine(line.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add line form */}
          {isEditable && (
            <form action={addLineFormAction} className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> Ajouter une ligne</p>
              <input type="hidden" name="repairOrderId" value={ro.id} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <select
                  name="type"
                  required
                  className="h-12 rounded-[var(--radius)] border border-input bg-background px-3 text-sm"
                >
                  <option value="part">Piece</option>
                  <option value="labor">Main d&apos;oeuvre</option>
                  <option value="other">Autre</option>
                </select>
                <Input name="description" placeholder="Description *" required className="sm:col-span-3" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Input name="reference" placeholder="Reference" />
                <Input name="quantity" type="number" step="0.01" min="0.01" placeholder="Qte *" required />
                <Input name="unitPrice" type="number" step="0.01" min="0" placeholder="Prix unit. *" required />
                <Input name="vatRate" type="number" step="0.01" defaultValue="20" placeholder="TVA %" />
                <Input name="discountPercent" type="number" step="0.01" min="0" max="100" defaultValue="0" placeholder="Remise %" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={addLinePending}>
                  {addLinePending ? <Spinner className="h-4 w-4" /> : "Ajouter"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
