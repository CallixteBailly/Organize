"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { X } from "lucide-react";
import { createStockItemAction, type StockActionState } from "@/server/actions/stock";
import { useDialog } from "@/lib/hooks/use-dialog";
import { toast } from "sonner";

const initialState: StockActionState = { success: false };

interface Props {
  categories: { id: string; name: string }[];
  onClose: () => void;
}

export function AddStockItemDialog({ categories, onClose }: Props) {
  const router = useRouter();
  const dialogRef = useDialog(onClose);
  const [state, formAction, isPending] = useActionState(createStockItemAction, initialState);

  useEffect(() => {
    if (state.success && state.itemId) {
      toast.success("Article cree");
      onClose();
      router.push(`/stock/${state.itemId}`);
    }
    if (state.error) toast.error(state.error);
  }, [state, onClose, router]);

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="add-stock-title" className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle id="add-stock-title">Nouvel article</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input name="reference" placeholder="Reference *" required aria-label="Reference" />
              <Input name="barcode" placeholder="Code-barres" aria-label="Code-barres" />
            </div>
            <Input name="name" placeholder="Nom de l'article *" required aria-label="Nom de l'article" />
            <div className="grid grid-cols-2 gap-3">
              <Input name="brand" placeholder="Marque" aria-label="Marque" />
              <select
                name="categoryId"
                aria-label="Categorie"
                className="h-12 w-full rounded-[var(--radius)] border border-input bg-background px-3 text-base"
              >
                <option value="">Sans categorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label htmlFor="stock-purchase-price" className="text-xs text-muted-foreground">Prix achat</label>
                <Input id="stock-purchase-price" name="purchasePrice" type="number" step="0.01" min="0" placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <label htmlFor="stock-selling-price" className="text-xs text-muted-foreground">Prix vente *</label>
                <Input id="stock-selling-price" name="sellingPrice" type="number" step="0.01" min="0" placeholder="0.00" required />
              </div>
              <div className="space-y-1">
                <label htmlFor="stock-vat-rate" className="text-xs text-muted-foreground">TVA %</label>
                <Input id="stock-vat-rate" name="vatRate" type="number" step="0.01" defaultValue="20" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label htmlFor="stock-quantity" className="text-xs text-muted-foreground">Quantite</label>
                <Input id="stock-quantity" name="quantity" type="number" min="0" defaultValue="0" />
              </div>
              <div className="space-y-1">
                <label htmlFor="stock-min-qty" className="text-xs text-muted-foreground">Seuil min</label>
                <Input id="stock-min-qty" name="minQuantity" type="number" min="0" defaultValue="0" />
              </div>
              <div className="space-y-1">
                <label htmlFor="stock-location" className="text-xs text-muted-foreground">Emplacement</label>
                <Input id="stock-location" name="location" placeholder="Ex: Etagere A3" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Spinner className="h-4 w-4" /> : "Creer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
