"use client";

import { useState, useCallback } from "react";
import { Spinner } from "@/components/ui/spinner";
import { PlateSearchForm } from "./plate-search-form";
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
}

export function CatalogShell({ initialPlate, targetRepairOrderId }: Props) {
  const [lookupLoading, setLookupLoading] = useState(false);
  const [partsLoading, setPartsLoading] = useState(false);
  const [vehicle, setVehicle] = useState<CatalogVehicle | null>(null);
  const [localVehicle, setLocalVehicle] = useState<LocalVehicle | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[] | null>(null);
  const [searchedPlate, setSearchedPlate] = useState(initialPlate ?? "");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [partsError, setPartsError] = useState<string | null>(null);

  const fetchParts = useCallback(async (kTypeId: number) => {
    setPartsLoading(true);
    setPartsError(null);
    try {
      const res = await fetch(`/api/catalog/parts?kTypeId=${kTypeId}`);
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

  const handleSearch = useCallback(
    async (plate: string) => {
      setSearchedPlate(plate);
      setLookupLoading(true);
      setLookupError(null);
      setVehicle(null);
      setLocalVehicle(null);
      setCategories(null);
      setPartsError(null);

      try {
        const normalized = plate.replace(/[\s-]/g, "");
        const res = await fetch(`/api/catalog/lookup?plate=${encodeURIComponent(normalized)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setLookupError(data.error ?? "Véhicule introuvable");
          return;
        }
        const data: LookupResponse = await res.json();
        setVehicle(data.vehicle);
        setLocalVehicle(data.localVehicle);
        await fetchParts(data.vehicle.kTypeId);
      } catch {
        setLookupError("Erreur réseau lors de la recherche");
      } finally {
        setLookupLoading(false);
      }
    },
    [fetchParts],
  );

  return (
    <div className="space-y-6">
      <PlateSearchForm
        defaultValue={initialPlate}
        loading={lookupLoading}
        error={lookupError}
        onSearch={handleSearch}
      />

      {vehicle && (
        <VehicleCard
          vehicle={vehicle}
          plate={searchedPlate.replace(/[\s-]/g, "").toUpperCase()}
          localVehicle={localVehicle}
        />
      )}

      {partsLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          <span>Chargement des pièces compatibles…</span>
        </div>
      )}

      {partsError && (
        <p className="text-sm text-destructive">{partsError}</p>
      )}

      {categories && !partsLoading && (
        <PartsCatalog
          categories={categories}
          repairOrderId={targetRepairOrderId ?? null}
        />
      )}
    </div>
  );
}
