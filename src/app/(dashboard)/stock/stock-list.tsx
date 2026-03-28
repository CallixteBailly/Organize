"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { Package, Plus, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { AddStockItemDialog } from "./add-stock-item-dialog";

interface StockItem {
  id: string;
  reference: string;
  name: string;
  brand: string | null;
  quantity: number;
  minQuantity: number;
  sellingPrice: string;
  categoryId: string | null;
  location: string | null;
  unit: string;
}

interface Category {
  id: string;
  name: string;
}

interface Props {
  items: StockItem[];
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
  currentQuery: string;
  currentCategory: string;
  lowStockOnly: boolean;
}

function getStockStatus(quantity: number, minQuantity: number) {
  if (quantity <= 0) return { label: "Rupture", variant: "destructive" as const };
  if (quantity <= minQuantity) return { label: "Bas", variant: "warning" as const };
  return { label: "OK", variant: "success" as const };
}

export function StockList({
  items,
  categories,
  total,
  page,
  totalPages,
  currentQuery,
  currentCategory,
  lowStockOnly,
}: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState(currentQuery);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const q = overrides.q ?? search;
    const cat = overrides.category ?? currentCategory;
    const low = overrides.lowStock ?? (lowStockOnly ? "true" : undefined);
    const p = overrides.page ?? "1";
    if (q) params.set("q", q);
    if (cat) params.set("category", cat);
    if (low) params.set("lowStock", low);
    if (p !== "1") params.set("page", p);
    return `/stock?${params.toString()}`;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({ q: search, page: "1" }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex-1">
          <SearchInput
            placeholder="Rechercher par nom, reference, code-barres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <div className="flex gap-2">
          <select
            value={currentCategory}
            onChange={(e) => router.push(buildUrl({ category: e.target.value || undefined, page: "1" }))}
            className="h-12 rounded-[var(--radius)] border border-input bg-background px-3 text-sm"
          >
            <option value="">Toutes categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Button
            variant={lowStockOnly ? "default" : "outline"}
            onClick={() => router.push(buildUrl({ lowStock: lowStockOnly ? undefined : "true", page: "1" }))}
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Alertes</span>
          </Button>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Ajouter</span>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun article"
          description={currentQuery ? "Aucun resultat pour cette recherche" : "Ajoutez votre premier article en stock"}
          action={
            !currentQuery ? (
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" />
                Ajouter un article
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const status = getStockStatus(item.quantity, item.minQuantity);
            return (
              <Link key={item.id} href={`/stock/${item.id}`}>
                <Card className="transition-colors hover:bg-secondary/50">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-foreground">{item.name}</p>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-mono">{item.reference}</span>
                        {item.brand && <span>{item.brand}</span>}
                        {item.location && <span>{item.location}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-foreground">
                        {item.quantity} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.sellingPrice)}
                      </p>
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
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => router.push(buildUrl({ page: String(page - 1) }))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => router.push(buildUrl({ page: String(page + 1) }))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {showAdd && <AddStockItemDialog categories={categories} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
