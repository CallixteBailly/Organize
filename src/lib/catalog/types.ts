export interface CatalogVehicle {
  kTypeId: number;
  make: string;
  model: string;
  year: number | null;
  engineCode: string | null;
  fuelType: string | null;
  displacement: number | null;
  variant?: string | null;
  powerKw?: number | null;
}

export interface CatalogPart {
  articleId: string;
  reference: string;
  name: string;
  brand: string;
  description: string | null;
  oemNumbers: string[];
  specs?: Array<{ name: string; value: string }>;
  images?: string[];
}

export interface CatalogCategory {
  id: string;
  name: string;
  parts: CatalogPart[];
}

export interface CatalogLookupResult {
  vehicle: CatalogVehicle;
  categories: CatalogCategory[];
}

export interface VehicleModelSearchParams {
  make: string;
  model: string;
  year?: number;
  fuelType?: string;
}

export interface IVehicleCatalogProvider {
  resolveVehicleByPlate(plate: string): Promise<CatalogVehicle | null>;
  getPartsByVehicle(kTypeId: number): Promise<CatalogCategory[]>;
  searchVehiclesByModel?(params: VehicleModelSearchParams): Promise<CatalogVehicle[]>;
}
