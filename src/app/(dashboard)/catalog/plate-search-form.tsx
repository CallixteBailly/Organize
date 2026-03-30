"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Search, Info } from "lucide-react";

export interface SearchParams {
  plate: string;
  formule?: string;
  nom?: string;
}

interface Props {
  defaultValue?: string;
  loading: boolean;
  error: string | null;
  useHistovec: boolean;
  onSearch: (params: SearchParams) => void;
}

function formatPlateInput(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5, 7)}`;
}

export function PlateSearchForm({ defaultValue = "", loading, error, useHistovec, onSearch }: Props) {
  const [plate, setPlate] = useState(defaultValue ? formatPlateInput(defaultValue) : "");
  const [formule, setFormule] = useState("");
  const [nom, setNom] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (plate.replace(/[\s-]/g, "").length < 5) return;
    if (useHistovec && (!formule.trim() || !nom.trim())) return;

    onSearch({
      plate,
      formule: formule.trim() || undefined,
      nom: nom.trim() || undefined,
    });
  }

  const canSubmit =
    plate.replace(/[\s-]/g, "").length >= 5 &&
    (!useHistovec || (formule.trim().length >= 6 && nom.trim().length >= 1));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Plaque */}
      <div className="flex gap-2">
        <Input
          value={plate}
          onChange={(e) => setPlate(formatPlateInput(e.target.value))}
          placeholder="Ex : FG-533-LT"
          maxLength={9}
          className="font-mono text-lg tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal max-w-xs"
          aria-label="Plaque d'immatriculation"
          autoComplete="off"
          spellCheck={false}
        />
        {!useHistovec && (
          <Button type="submit" disabled={loading || !canSubmit}>
            {loading ? <Spinner className="size-4" /> : <Search className="size-4" />}
            <span className="ml-2 hidden sm:inline">Rechercher</span>
          </Button>
        )}
      </div>

      {/* Champs Histovec (carte grise) */}
      {useHistovec && (
        <>
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <Info className="size-3.5 mt-0.5 shrink-0" />
            <span>Ces informations figurent sur la carte grise du véhicule.</span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">N° de formule <span className="text-destructive">*</span></label>
              <Input
                value={formule}
                onChange={(e) => setFormule(e.target.value.toUpperCase())}
                placeholder="Ex : 20140AB12345"
                maxLength={15}
                className="font-mono uppercase w-full sm:w-48"
                aria-label="Numéro de formule"
                required
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Nom du titulaire <span className="text-destructive">*</span></label>
              <Input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex : DUPONT"
                className="uppercase w-full sm:w-48"
                aria-label="Nom du titulaire"
                required
                autoComplete="off"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading || !canSubmit}>
                {loading ? <Spinner className="size-4" /> : <Search className="size-4" />}
                <span className="ml-2 hidden sm:inline">Rechercher</span>
              </Button>
            </div>
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
