"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layouts/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Package, Zap } from "lucide-react";
import { quickOrderAction, type OrderActionState } from "@/server/actions/orders";
import { toast } from "sonner";

const initialState: OrderActionState = { success: false };

interface StockItem {
  id: string;
  name: string;
  reference: string;
  brand: string | null;
  quantity: number;
  sellingPrice: string;
}

interface SupplierOffer {
  catalogEntry: { id: string; unitPrice: string; supplierReference: string };
  supplierName: string;
  supplierDeliveryDays: number | null;
}

export default function QuickOrderPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(quickOrderAction, initialState);

  const [search, setSearch] = useState("");
  const [items, setItems] = useState<StockItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [offers, setOffers] = useState<SupplierOffer[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(false);

  useEffect(() => {
    if (state.success) {
      toast.success("Commande passee !");
      router.push("/orders");
    }
    if (state.error) toast.error(state.error);
  }, [state, router]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setLoadingSearch(true);
    try {
      // Try barcode first
      let res = await fetch(`/api/stock/scan?barcode=${encodeURIComponent(search)}`);
      if (res.ok) {
        const item = await res.json();
        setItems([item]);
      } else {
        // Fallback: search by name/ref (reuse the stock page logic)
        res = await fetch(`/api/stock/scan?barcode=${encodeURIComponent(search)}`);
        setItems(res.ok ? [await res.json()] : []);
      }
    } catch {
      setItems([]);
    }
    setLoadingSearch(false);
  }

  async function handleSelectItem(item: StockItem) {
    setSelectedItem(item);
    setLoadingOffers(true);
    try {
      const res = await fetch(`/api/suppliers/compare?stockItemId=${item.id}`);
      if (res.ok) setOffers(await res.json());
      else setOffers([]);
    } catch {
      setOffers([]);
    }
    setLoadingOffers(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Commande rapide" description="Scan ou recherche → comparaison → 1 tap" />

      {/* Step 1: Search */}
      <Card>
        <CardHeader>
          <CardTitle>1. Identifier la piece</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-3">
            <SearchInput
              placeholder="Code-barres, reference ou nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loadingSearch}>
              {loadingSearch ? <Spinner className="h-4 w-4" /> : "Rechercher"}
            </Button>
          </form>
          {items.length > 0 && (
            <div className="mt-3 space-y-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`w-full rounded-[var(--radius)] border p-3 text-left transition-colors hover:bg-secondary/50 ${
                    selectedItem?.id === item.id ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.reference} — Stock: {item.quantity}
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Compare suppliers */}
      {selectedItem && (
        <Card>
          <CardHeader>
            <CardTitle>2. Comparer les fournisseurs</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOffers ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : offers.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Aucune offre"
                description="Aucun fournisseur ne propose cet article dans son catalogue"
                className="py-6"
              />
            ) : (
              <div className="space-y-2">
                {offers.map((offer, i) => (
                  <form key={offer.catalogEntry.id} action={formAction}>
                    <input type="hidden" name="stockItemId" value={selectedItem.id} />
                    <input type="hidden" name="supplierId" value={offer.catalogEntry.id} />
                    <input type="hidden" name="quantity" value="1" />
                    <div className="flex items-center gap-4 rounded-[var(--radius)] border border-border p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{offer.supplierName}</p>
                          {i === 0 && <span className="rounded bg-success/10 px-2 py-0.5 text-xs font-medium text-success">Meilleur prix</span>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Ref: {offer.catalogEntry.supplierReference}
                          {offer.supplierDeliveryDays && ` — ${offer.supplierDeliveryDays}j livraison`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{offer.catalogEntry.unitPrice} EUR</p>
                      </div>
                      <Button type="submit" disabled={isPending} size="sm">
                        {isPending ? <Spinner className="h-4 w-4" /> : <><Zap className="h-4 w-4" /> Commander</>}
                      </Button>
                    </div>
                  </form>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
