"use client";

import { useState, useCallback, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { PlateSearchForm, type SearchParams } from "./plate-search-form";
import { VehicleModelSearchForm, type ModelSearchParams } from "./vehicle-model-search-form";
import { VehicleCard } from "./vehicle-card";
import { PartsCatalog } from "./parts-catalog";
import type { CatalogVehicle, CatalogCategory } from "@/lib/catalog";

interface LocalVehicle {
  id: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  licensePlate: string | null;
}

interface LookupResponse {
  vehicle: CatalogVehicle;
  localVehicleId: string | null;
  localVehicle: LocalVehicle | null;
}

interface PartsResponse {
  categories: CatalogCategory[];
}

interface Props {
  initialPlate?: string;
  targetRepairOrderId?: string;
  useHistovec: boolean;
}

type SearchMode = "plate" | "model";

export function CatalogShell({ initialPlate, targetRepairOrderId, useHistovec }: Props) {
  const [searchMode, setSearchMode] = useState<SearchMode>("plate");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [partsLoading, setPartsLoading] = useState(false);
  const [vehicle, setVehicle] = useState<CatalogVehicle | null>(null);
  const [localVehicle, setLocalVehicle] = useState<LocalVehicle | null>(null);
  const [variants, setVariants] = useState<CatalogVehicle[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[] | null>(null);
  const [searchedPlate, setSearchedPlate] = useState(initialPlate ?? "");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [partsError, setPartsError] = useState<string | null>(null);

  function switchSearchMode(mode: SearchMode) {
    if (mode === searchMode) return;
    setSearchMode(mode);
    setVehicle(null);
    setLocalVehicle(null);
    setVariants([]);
    setCategories(null);
    setLookupError(null);
    setPartsError(null);
    setSearchedPlate("");
  }

  const fetchParts = useCallback(async (kTypeId: number, vehicleMake?: string, vehicleModel?: string) => {
    setPartsLoading(true);
    setPartsError(null);
    try {
      const url = new URL("/api/catalog/parts", window.location.origin);
      url.searchParams.set("kTypeId", String(kTypeId));
      if (vehicleMake) url.searchParams.set("make", vehicleMake);
      if (vehicleModel) url.searchParams.set("model", vehicleModel);
      // Force refresh pour récupérer les données à jour de l'API
      url.searchParams.set("refresh", "1");
      const res = await fetch(url.toString());
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPartsError(data.error ?? "Impossible de charger les pièces");
        return;
      }
      const data: PartsResponse = await res.json();
      setCategories(data.categories);
    } catch {
      setPartsError("Erreur réseau lors du chargement des pièces");
    } finally {
      setPartsLoading(false);
    }
  }, []);

  const handlePlateSearch = useCallback(
    async ({ plate, formule, nom }: SearchParams) => {
      setSearchedPlate(plate);
      setLookupLoading(true);
      setLookupError(null);
      setVehicle(null);
      setLocalVehicle(null);
      setCategories(null);
      setPartsError(null);

      try {
        const normalized = plate.replace(/[\s-]/g, "");
        const url = new URL("/api/catalog/lookup", window.location.origin);
        url.searchParams.set("plate", normalized);
        if (formule) url.searchParams.set("formule", formule);
        if (nom) url.searchParams.set("nom", nom);

        const res = await fetch(url.toString());
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setLookupError(data.error ?? "Véhicule introuvable");
          return;
        }
        const data: LookupResponse = await res.json();
        setVehicle(data.vehicle);
        setLocalVehicle(data.localVehicle);
        await fetchParts(data.vehicle.kTypeId, data.vehicle.make, data.vehicle.model);
      } catch {
        setLookupError("Erreur réseau lors de la recherche");
      } finally {
        setLookupLoading(false);
      }
    },
    [fetchParts],
  );

  const selectVariant = useCallback(
    async (v: CatalogVehicle) => {
      setVehicle(v);
      setVariants([]);
      await fetchParts(v.kTypeId, v.make, v.model);
    },
    [fetchParts],
  );

  const handleModelSearch = useCallback(
    async (params: ModelSearchParams) => {
      setLookupLoading(true);
      setLookupError(null);
      setVehicle(null);
      setLocalVehicle(null);
      setVariants([]);
      setCategories(null);
      setPartsError(null);

      try {
        const url = new URL("/api/catalog/model-search", window.location.origin);
        url.searchParams.set("make", params.make);
        url.searchParams.set("model", params.model);
        if (params.year) url.searchParams.set("year", String(params.year));
        if (params.fuelType) url.searchParams.set("fuelType", params.fuelType);

        const res = await fetch(url.toString());
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setLookupError(data.error ?? "Véhicule introuvable");
          return;
        }
        const data: { vehicle: CatalogVehicle; variants: CatalogVehicle[] } = await res.json();

        if (data.variants.length > 1) {
          // Plusieurs variantes — laisser l'utilisateur choisir
          setVariants(data.variants);
        } else {
          setVehicle(data.vehicle);
          await fetchParts(data.vehicle.kTypeId, data.vehicle.make, data.vehicle.model);
        }
      } catch {
        setLookupError("Erreur réseau lors de la recherche");
      } finally {
        setLookupLoading(false);
      }
    },
    [fetchParts],
  );

  // Auto-search if a plate is passed via URL (e.g. from a repair order)
  useEffect(() => {
    if (initialPlate && !useHistovec) {
      handlePlateSearch({ plate: initialPlate });
    }
    // Only on mount — handlePlateSearch is stable (useCallback)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Search mode tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          type="button"
          onClick={() => switchSearchMode("plate")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            searchMode === "plate"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Par immatriculation
        </button>
        <button
          type="button"
          onClick={() => switchSearchMode("model")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            searchMode === "model"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Par marque / modèle
        </button>
      </div>

      {searchMode === "plate" ? (
        <PlateSearchForm
          defaultValue={initialPlate}
          loading={lookupLoading}
          error={lookupError}
          useHistovec={useHistovec}
          onSearch={handlePlateSearch}
        />
      ) : (
        <VehicleModelSearchForm
          loading={lookupLoading}
          error={lookupError}
          onSearch={handleModelSearch}
        />
      )}

      {variants.length > 1 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{variants.length} variantes trouvees — selectionnez votre vehicule :</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {variants.map((v) => (
              <button
                key={v.kTypeId}
                type="button"
                onClick={() => selectVariant(v)}
                className="rounded-[var(--radius)] border border-border p-3 text-left transition-colors hover:bg-secondary/50 hover:border-primary"
              >
                <p className="font-medium">{v.make} {v.model}</p>
                <p className="text-sm text-muted-foreground">
                  {v.year && <span>{v.year}</span>}
                  {v.variant && <span> — {v.variant}</span>}
                  {v.fuelType && <span> — {v.fuelType}</span>}
                  {v.displacement && <span> — {v.displacement} cc</span>}
                  {v.powerKw && <span> — {v.powerKw} kW</span>}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {vehicle && (
        <VehicleCard
          vehicle={vehicle}
          plate={
            searchMode === "plate"
              ? searchedPlate.replace(/[\s-]/g, "").toUpperCase()
              : undefined
          }
          localVehicle={localVehicle}
        />
      )}

      {partsLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          <span>Chargement des pièces compatibles…</span>
        </div>
      )}

      {partsError && <p className="text-sm text-destructive">{partsError}</p>}

      {categories && !partsLoading && (
        <PartsCatalog
          categories={categories}
          repairOrderId={targetRepairOrderId ?? null}
        />
      )}
    </div>
  );
}
