"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Package } from "lucide-react";
import { AddToRepairOrderForm } from "./add-to-repair-order-form";
import type { CatalogCategory } from "@/lib/catalog";

interface Props {
  categories: CatalogCategory[];
  repairOrderId: string | null;
}

export function PartsCatalog({ categories, repairOrderId }: Props) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(categories.length > 0 ? [categories[0].id] : []),
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

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        <Package className="mx-auto mb-2 size-8 opacity-40" />
        <p className="text-sm">Aucune pièce trouvée pour ce véhicule</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!repairOrderId && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          💡 Pour commander une pièce, ouvrez ce catalogue depuis une intervention.
        </p>
      )}
      {categories.map((category) => {
        const isOpen = openCategories.has(category.id);
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
              <div className="border-t border-border divide-y divide-border/50">
                {category.parts.map((part) => (
                  <div
                    key={part.articleId}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Nom de la pièce — info principale */}
                      <p className="font-semibold text-foreground leading-snug">{part.name}</p>

                      {/* Marque + référence — secondaires */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">
                          {part.brand}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {part.reference}
                        </span>
                      </div>

                      {/* Specs techniques */}
                      {part.description && (
                        <p className="text-xs text-muted-foreground">{part.description}</p>
                      )}

                      {/* Références constructeur */}
                      {part.oemNumbers.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-xs text-muted-foreground">Réf. constructeur :</span>
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
                        <AddToRepairOrderForm part={part} repairOrderId={repairOrderId} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
