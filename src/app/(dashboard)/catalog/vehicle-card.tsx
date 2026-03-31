"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, ExternalLink, Fuel, Gauge, Calendar } from "lucide-react";
import Link from "next/link";
import type { CatalogVehicle } from "@/lib/catalog";

interface LocalVehicle {
  id: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  licensePlate: string | null;
}

interface Props {
  vehicle: CatalogVehicle;
  plate?: string;
  localVehicle: LocalVehicle | null;
}

export function VehicleCard({ vehicle, plate, localVehicle }: Props) {
  const fuelLabel = vehicle.fuelType
    ? vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1).toLowerCase()
    : null;

  return (
    <Card className="border-success/30 bg-success/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-success/10 p-2 mt-0.5">
              <Car className="size-5 text-success" />
            </div>
            <div className="space-y-1.5">
              {/* Marque + Modèle */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground text-base">
                  {vehicle.make} {vehicle.model}
                </span>
                {vehicle.year && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {vehicle.year}
                  </Badge>
                )}
                {localVehicle && (
                  <Badge variant="success" className="text-xs">Connu</Badge>
                )}
              </div>

              {/* Variante moteur (si disponible) */}
              {vehicle.variant && (
                <p className="text-xs text-muted-foreground leading-snug">
                  {vehicle.variant}
                </p>
              )}

              {/* Caractéristiques techniques */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {plate && (
                  <span className="font-mono tracking-wider uppercase bg-muted/60 px-1.5 py-0.5 rounded">
                    {plate}
                  </span>
                )}
                {fuelLabel && (
                  <span className="flex items-center gap-1">
                    <Fuel className="size-3" />
                    {fuelLabel}
                  </span>
                )}
                {vehicle.displacement && (
                  <span className="flex items-center gap-1">
                    <Gauge className="size-3" />
                    {vehicle.displacement} cc
                  </span>
                )}
                {vehicle.powerKw && (
                  <span>{vehicle.powerKw} kW ({Math.round(vehicle.powerKw * 1.36)} ch)</span>
                )}
                {vehicle.engineCode && (
                  <span>Moteur : {vehicle.engineCode}</span>
                )}
              </div>
            </div>
          </div>
          {localVehicle && (
            <Link
              href={`/customers?vehicleId=${localVehicle.id}`}
              className="flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap"
            >
              Voir fiche
              <ExternalLink className="size-3" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
