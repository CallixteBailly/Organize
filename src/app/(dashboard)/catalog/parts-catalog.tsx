"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Package,
  Search,
  X,
} from "lucide-react";
import { AddToRepairOrderForm } from "./add-to-repair-order-form";
import type { CatalogCategory } from "@/lib/catalog";

interface Props {
  categories: CatalogCategory[];
  repairOrderId: string | null;
}

const PARTS_PER_PAGE = 20;

export function PartsCatalog({ categories, repairOrderId }: Props) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const totalParts = useMemo(
    () => categories.reduce((sum, c) => sum + c.parts.length, 0),
    [categories],
  );

  // Filtre les catégories et pièces selon la recherche
  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        parts: cat.parts.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.reference.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.oemNumbers.some((o) => o.toLowerCase().includes(q)),
        ),
      }))
      .filter((cat) => cat.parts.length > 0);
  }, [categories, search]);

  const filteredTotal = useMemo(
    () => filtered.reduce((sum, c) => sum + c.parts.length, 0),
    [filtered],
  );

  function toggleCategory(id: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function showMoreParts(categoryId: string) {
    setExpandedCategories((prev) => new Set(prev).add(categoryId));
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        <Package className="mx-auto mb-2 size-8 opacity-40" />
        <p className="text-sm">Aucune pièce trouvée pour ce véhicule</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header : info + recherche */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Pièces compatibles
          </h2>
          <Badge variant="secondary" className="text-xs">
            {totalParts} pièces
          </Badge>
          <Badge variant="outline" className="text-xs">
            {categories.length} catégories
          </Badge>
        </div>
        {/* Barre de recherche */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrer par nom, marque, ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {!repairOrderId && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          Pour commander une pièce, ouvrez ce catalogue depuis une intervention.
        </p>
      )}

      {/* Résultats filtrés */}
      {search && (
        <p className="text-xs text-muted-foreground">
          {filteredTotal} résultat{filteredTotal !== 1 ? "s" : ""} pour &quot;{search}&quot;
        </p>
      )}

      {filtered.length === 0 && search && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
          <p className="text-sm">Aucune pièce ne correspond à &quot;{search}&quot;</p>
        </div>
      )}

      {/* Catégories */}
      {filtered.map((category) => {
        const isOpen = openCategories.has(category.id) || !!search;
        const isExpanded = expandedCategories.has(category.id);
        const visibleParts =
          isExpanded || search
            ? category.parts
            : category.parts.slice(0, PARTS_PER_PAGE);
        const hasMore =
          !isExpanded && !search && category.parts.length > PARTS_PER_PAGE;

        return (
          <Card key={category.id} className="overflow-hidden p-0">
            <button
              type="button"
              onClick={() => toggleCategory(category.id)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                <span className="font-medium">{category.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {category.parts.length}
                </Badge>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border">
                {/* Grille de pièces */}
                <div className="divide-y divide-border/50">
                  {visibleParts.map((part) => {
                    // Si le nom de la pièce est identique au nom de la catégorie,
                    // c'est que la description n'a pas été scrapée : on adapte l'affichage
                    const hasRealName =
                      part.name !== category.name && part.name !== "";

                    return (
                      <div
                        key={part.articleId}
                        className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/20 transition-colors"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Marque */}
                            <span className="text-xs font-bold text-primary uppercase tracking-wider">
                              {part.brand}
                            </span>
                            {/* Référence */}
                            <span className="font-mono text-sm font-semibold text-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                              {part.reference}
                            </span>
                          </div>

                          {/* Nom/description de la pièce si disponible */}
                          {hasRealName && (
                            <p className="text-sm text-foreground leading-snug">
                              {part.name}
                            </p>
                          )}

                          {/* Specs techniques */}
                          {part.description && (
                            <p className="text-xs text-muted-foreground">
                              {part.description}
                            </p>
                          )}

                          {/* Références constructeur */}
                          {part.oemNumbers.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="text-xs text-muted-foreground">
                                OEM :
                              </span>
                              {part.oemNumbers.slice(0, 3).map((oem, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center text-xs bg-muted/60 border border-border/50 px-2 py-0.5 rounded font-mono text-muted-foreground"
                                >
                                  {oem}
                                </span>
                              ))}
                              {part.oemNumbers.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{part.oemNumbers.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {repairOrderId && (
                          <div className="shrink-0">
                            <AddToRepairOrderForm
                              part={part}
                              repairOrderId={repairOrderId}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bouton "Voir plus" */}
                {hasMore && (
                  <div className="border-t border-border/50 p-3 text-center">
                    <button
                      type="button"
                      onClick={() => showMoreParts(category.id)}
                      className="text-sm text-primary hover:underline"
                    >
                      Afficher les {category.parts.length - PARTS_PER_PAGE} pièces restantes
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
