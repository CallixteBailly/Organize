"use client";

import { useActionState, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Truck, Plus, Trash2, X } from "lucide-react";
import { Card as CardWrapper, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createSupplierAction,
  deactivateSupplierAction,
  type SupplierActionState,
} from "@/server/actions/orders";
import { toast } from "sonner";

interface Supplier {
  id: string;
  name: string;
  code: string | null;
  email: string | null;
  phone: string | null;
  deliveryDays: number | null;
  isActive: boolean;
}

interface Props {
  suppliers: Supplier[];
}

const initialState: SupplierActionState = { success: false };

export function SupplierManager({ suppliers }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [state, formAction, isPending] = useActionState(createSupplierAction, initialState);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Fournisseur ajoute");
      setShowAdd(false);
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  async function handleDelete(id: string) {
    setDeleting(id);
    const result = await deactivateSupplierAction(id);
    setDeleting(null);
    if (result.success) toast.success("Fournisseur desactive");
    else toast.error(result.error ?? "Erreur");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Aucun fournisseur"
          description="Ajoutez vos fournisseurs de pieces detachees"
        />
      ) : (
        <div className="space-y-2">
          {suppliers.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{s.name}</p>
                    {s.code && <span className="text-xs text-muted-foreground font-mono">{s.code}</span>}
                  </div>
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    {s.email && <span>{s.email}</span>}
                    {s.phone && <span>{s.phone}</span>}
                    {s.deliveryDays && <span>{s.deliveryDays}j livraison</span>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(s.id)}
                  disabled={deleting === s.id}
                >
                  {deleting === s.id ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <CardWrapper className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nouveau fournisseur</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAdd(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form action={formAction} className="space-y-4">
                <Input name="name" placeholder="Nom du fournisseur *" required />
                <Input name="code" placeholder="Code / compte fournisseur" />
                <div className="grid grid-cols-2 gap-3">
                  <Input name="email" type="email" placeholder="Email" />
                  <Input name="phone" type="tel" placeholder="Telephone" />
                </div>
                <Input name="contactName" placeholder="Nom du contact" />
                <div className="grid grid-cols-2 gap-3">
                  <Input name="deliveryDays" type="number" min="0" placeholder="Delai livraison (jours)" />
                  <Input name="minOrderAmount" type="number" step="0.01" min="0" placeholder="Commande min (EUR)" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Annuler</Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? <Spinner className="h-4 w-4" /> : "Creer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </CardWrapper>
        </div>
      )}
    </div>
  );
}
