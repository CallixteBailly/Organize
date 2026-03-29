"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { addCatalogPartToRepairOrderAction } from "@/server/actions/catalog";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { RepairOrderActionState } from "@/server/actions/repair-orders";
import type { CatalogPart } from "@/lib/catalog";

interface Props {
  part: CatalogPart;
  repairOrderId: string;
}

const initial: RepairOrderActionState = { success: false };

export function AddToRepairOrderForm({ part, repairOrderId }: Props) {
  const [state, formAction, pending] = useActionState(addCatalogPartToRepairOrderAction, initial);

  useEffect(() => {
    if (state.success) toast.success("Pièce ajoutée à l'OR");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="repairOrderId" value={repairOrderId} />
      <input type="hidden" name="description" value={part.name} />
      <input type="hidden" name="reference" value={part.reference} />
      <input type="hidden" name="brand" value={part.brand} />
      <input type="hidden" name="vatRate" value="20" />
      <Input
        name="quantity"
        type="number"
        min="1"
        step="1"
        defaultValue="1"
        className="w-16 h-8 text-sm text-center"
        aria-label="Quantité"
      />
      <Input
        name="unitPrice"
        type="number"
        min="0"
        step="0.01"
        defaultValue="0"
        className="w-24 h-8 text-sm"
        placeholder="Prix €"
        aria-label="Prix unitaire"
      />
      <Button type="submit" size="sm" disabled={pending} className="h-8 gap-1">
        {pending ? <Spinner className="size-3" /> : <Plus className="size-3" />}
        Ajouter
      </Button>
    </form>
  );
}
