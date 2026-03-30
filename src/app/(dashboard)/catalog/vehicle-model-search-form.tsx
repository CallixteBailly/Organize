"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Search } from "lucide-react";

export interface ModelSearchParams {
  make: string;
  model: string;
  year?: number;
  fuelType?: string;
}

interface Props {
  loading: boolean;
  error: string | null;
  onSearch: (params: ModelSearchParams) => void;
}

const POPULAR_MAKES = [
  "Alfa Romeo",
  "Audi",
  "BMW",
  "Citroën",
  "Dacia",
  "Ferrari",
  "Fiat",
  "Ford",
  "Honda",
  "Hyundai",
  "Jeep",
  "Kia",
  "Land Rover",
  "Lexus",
  "Mazda",
  "Mercedes-Benz",
  "Mini",
  "Mitsubishi",
  "Nissan",
  "Opel",
  "Peugeot",
  "Porsche",
  "Renault",
  "Seat",
  "Skoda",
  "Smart",
  "Subaru",
  "Suzuki",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
];

const FUEL_TYPES = [
  "Essence",
  "Diesel",
  "Hybride",
  "Électrique",
  "GPL",
  "Hydrogène",
] as const;

export function VehicleModelSearchForm({ loading, error, onSearch }: Props) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [fuelType, setFuelType] = useState("");

  const canSubmit = make.trim().length >= 2 && model.trim().length >= 1;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const parsedYear = year ? parseInt(year, 10) : undefined;
    onSearch({
      make: make.trim(),
      model: model.trim(),
      year: parsedYear && !isNaN(parsedYear) ? parsedYear : undefined,
      fuelType: fuelType || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {/* Make */}
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label htmlFor="vehicle-make" className="text-xs text-muted-foreground">
            Marque <span className="text-destructive">*</span>
          </label>
          <Input
            id="vehicle-make"
            list="makes-datalist"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="Ex : Renault"
            autoComplete="off"
            spellCheck={false}
          />
          <datalist id="makes-datalist">
            {POPULAR_MAKES.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>

        {/* Model */}
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label htmlFor="vehicle-model" className="text-xs text-muted-foreground">
            Modèle <span className="text-destructive">*</span>
          </label>
          <Input
            id="vehicle-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Ex : Clio"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Year */}
        <div className="flex flex-col gap-1 w-24">
          <label htmlFor="vehicle-year" className="text-xs text-muted-foreground">
            Année
          </label>
          <Input
            id="vehicle-year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2018"
            min={1950}
            max={new Date().getFullYear() + 1}
          />
        </div>

        {/* Fuel type */}
        <div className="flex flex-col gap-1 min-w-[130px]">
          <label htmlFor="vehicle-fuel" className="text-xs text-muted-foreground">
            Carburant
          </label>
          <select
            id="vehicle-fuel"
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Tous</option>
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <div className="flex items-end">
          <Button type="submit" disabled={loading || !canSubmit}>
            {loading ? <Spinner className="size-4" /> : <Search className="size-4" />}
            <span className="ml-2 hidden sm:inline">Rechercher</span>
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
