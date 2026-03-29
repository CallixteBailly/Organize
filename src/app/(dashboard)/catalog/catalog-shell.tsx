"use client";

import { useState, useCallback, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { PlateSearchForm, type SearchParams } from "./plate-search-form";
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

export function CatalogShell({ initialPlate, targetRepairOrderId, useHistovec }: Props) {
  const [lookupLoading, setLookupLoading] = useState(false);
  const [partsLoading, setPartsLoading] = useState(false);
  const [vehicle, setVehicle] = useState<CatalogVehicle | null>(null);
  const [localVehicle, setLocalVehicle] = useState<LocalVehicle | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[] | null>(null);
  const [searchedPlate, setSearchedPlate] = useState(initialPlate ?? "");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [partsError, setPartsError] = useState<string | null>(null);

  const fetchParts = useCallback(async (kTypeId: number, vehicleMake?: string, vehicleModel?: string) => {
    setPartsLoading(true);
    setPartsError(null);
    try {
      const url = new URL("/api/catalog/parts", window.location.origin);
      url.searchParams.set("kTypeId", String(kTypeId));
      if (vehicleMake) url.searchParams.set("make", vehicleMake);
      if (vehicleModel) url.searchParams.set("model", vehicleModel);
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

  const handleSearch = useCallback(
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

  // Auto-recherche si une plaque est passée en URL (depuis un OR par exemple)
  useEffect(() => {
    if (initialPlate && !useHistovec) {
      handleSearch({ plate: initialPlate });
    }
    // On veut juste lancer la recherche au montage — handleSearch est stable (useCallback)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PlateSearchForm
        defaultValue={initialPlate}
        loading={lookupLoading}
        error={lookupError}
        useHistovec={useHistovec}
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
