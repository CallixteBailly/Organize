"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { X } from "lucide-react";
import { recordMovementAction, type StockActionState } from "@/server/actions/stock";
import { useDialog } from "@/lib/hooks/use-dialog";
import { toast } from "sonner";

const initialState: StockActionState = { success: false };

interface Props {
  stockItemId: string;
  unit: string;
  onClose: () => void;
}

export function RecordMovementDialog({ stockItemId, unit, onClose }: Props) {
  const dialogRef = useDialog(onClose);
  const [state, formAction, isPending] = useActionState(recordMovementAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Mouvement enregistre");
      onClose();
    }
    if (state.error) toast.error(state.error);
  }, [state, onClose]);

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="movement-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle id="movement-title">Nouveau mouvement</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="stockItemId" value={stockItemId} />
            <div className="space-y-2">
              <label htmlFor="movement-type" className="text-sm font-medium">Type</label>
              <select
                id="movement-type"
                name="type"
                required
                className="flex h-12 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="entry">Entree (reception)</option>
                <option value="exit">Sortie (consommation)</option>
                <option value="adjustment">Ajustement (inventaire)</option>
                <option value="return">Retour fournisseur</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="movement-quantity" className="text-sm font-medium">Quantite ({unit})</label>
              <Input id="movement-quantity" name="quantity" type="number" min="1" required placeholder="1" />
            </div>
            <div className="space-y-2">
              <label htmlFor="movement-unit-price" className="text-sm font-medium">Prix unitaire (optionnel)</label>
              <Input id="movement-unit-price" name="unitPrice" type="number" step="0.01" min="0" />
            </div>
            <div className="space-y-2">
              <label htmlFor="movement-reason" className="text-sm font-medium">Raison (optionnel)</label>
              <Input id="movement-reason" name="reason" placeholder="Ex: Reception commande #123" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Spinner className="h-4 w-4" /> : "Enregistrer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
