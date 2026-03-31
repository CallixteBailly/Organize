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
  Copy,
  Check,
  Image as ImageIcon,
  Wrench,
  Tag,
} from "lucide-react";
import { AddToRepairOrderForm } from "./add-to-repair-order-form";
import type { CatalogCategory } from "@/lib/catalog";

interface Props {
  categories: CatalogCategory[];
  repairOrderId: string | null;
}

const PARTS_PER_PAGE = 20;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      title="Copier la référence"
    >
      {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
    </button>
  );
}

function PartCard({
  part,
  categoryName,
  repairOrderId,
}: {
  part: CatalogCategory["parts"][0];
  categoryName: string;
  repairOrderId: string | null;
}) {
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const hasRealName = part.name !== categoryName && part.name !== "";
  const specs = part.specs ?? [];
  const images = part.images ?? [];
  const visibleSpecs = showAllSpecs ? specs : specs.slice(0, 4);

  return (
    <div className="flex flex-col gap-3 p-4 hover:bg-muted/20 transition-colors">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          {/* Ligne 1 : Marque + Référence + Copier */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="text-xs font-bold uppercase tracking-wider">
              {part.brand}
            </Badge>
            <div className="flex items-center gap-1 bg-muted/60 border border-border/50 rounded px-2 py-0.5">
              <span className="font-mono text-sm font-semibold text-foreground">
                {part.reference}
              </span>
              <CopyButton text={part.reference} />
            </div>
            {images.length > 0 && (
              <button
                type="button"
                onClick={() => setShowImage(!showImage)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ImageIcon className="size-3" />
                Photo
              </button>
            )}
          </div>

          {/* Ligne 2 : Nom descriptif de la pièce */}
          {hasRealName && (
            <p className="text-sm font-medium text-foreground leading-snug">
              {part.name}
            </p>
          )}

          {/* Ligne 3 : Specs techniques en badges */}
          {specs.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                {visibleSpecs.map((s, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full"
                  >
                    <Wrench className="size-2.5 shrink-0" />
                    <span className="font-medium">{s.name}</span>
                    <span className="text-blue-500 dark:text-blue-400">
                      {s.value}
                    </span>
                  </span>
                ))}
              </div>
              {specs.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllSpecs(!showAllSpecs)}
                  className="text-xs text-primary hover:underline"
                >
                  {showAllSpecs
                    ? "Moins de détails"
                    : `+${specs.length - 4} caractéristiques`}
                </button>
              )}
            </div>
          )}

          {/* Fallback : description texte si pas de specs structurées */}
          {specs.length === 0 && part.description && (
            <p className="text-xs text-muted-foreground italic">
              {part.description}
            </p>
          )}

          {/* Références constructeur (OEM) */}
          {part.oemNumbers.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <Tag className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">
                OEM :
              </span>
              {part.oemNumbers.slice(0, 3).map((oem, i) => (
                <span
                  key={i}
                  className="inline-flex items-center text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded font-mono text-amber-700 dark:text-amber-300"
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

        {/* Bouton ajouter à l'OR */}
        {repairOrderId && (
          <div className="shrink-0">
            <AddToRepairOrderForm part={part} repairOrderId={repairOrderId} />
          </div>
        )}
      </div>

      {/* Image du produit (toggle) */}
      {showImage && images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pt-1">
          {images.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`${part.brand} ${part.reference}`}
              className="h-24 w-24 rounded-lg border border-border object-contain bg-white"
              loading="lazy"
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
            p.oemNumbers.some((o) => o.toLowerCase().includes(q)) ||
            p.specs?.some(
              (s) =>
                s.name.toLowerCase().includes(q) ||
                s.value.toLowerCase().includes(q),
            ),
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
      {/* Header */}
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
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrer par nom, marque, ref, spec..."
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

      {search && (
        <p className="text-xs text-muted-foreground">
          {filteredTotal} résultat{filteredTotal !== 1 ? "s" : ""} pour
          &quot;{search}&quot;
        </p>
      )}

      {filtered.length === 0 && search && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
          <p className="text-sm">
            Aucune pièce ne correspond à &quot;{search}&quot;
          </p>
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
                <div className="divide-y divide-border/50">
                  {visibleParts.map((part) => (
                    <PartCard
                      key={part.articleId}
                      part={part}
                      categoryName={category.name}
                      repairOrderId={repairOrderId}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="border-t border-border/50 p-3 text-center">
                    <button
                      type="button"
                      onClick={() => showMoreParts(category.id)}
                      className="text-sm text-primary hover:underline"
                    >
                      Afficher les {category.parts.length - PARTS_PER_PAGE}{" "}
                      pièces restantes
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
