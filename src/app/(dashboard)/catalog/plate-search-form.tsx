"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Search } from "lucide-react";

interface Props {
  defaultValue?: string;
  loading: boolean;
  error: string | null;
  onSearch: (plate: string) => void;
}

function formatPlateInput(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5, 7)}`;
}

export function PlateSearchForm({ defaultValue = "", loading, error, onSearch }: Props) {
  const [plate, setPlate] = useState(defaultValue ? formatPlateInput(defaultValue) : "");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPlate(formatPlateInput(e.target.value));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = plate.replace(/[\s-]/g, "");
    if (normalized.length >= 5) {
      onSearch(plate);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={plate}
          onChange={handleChange}
          placeholder="Ex : FG-533-LT"
          maxLength={9}
          className="font-mono text-lg tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal max-w-xs"
          aria-label="Plaque d'immatriculation"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" disabled={loading || plate.replace(/[\s-]/g, "").length < 5}>
          {loading ? <Spinner className="size-4" /> : <Search className="size-4" />}
          <span className="ml-2 hidden sm:inline">Rechercher</span>
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
