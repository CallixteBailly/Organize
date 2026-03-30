"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, ExternalLink } from "lucide-react";
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
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-success/10 p-2">
              <Car className="size-5 text-success" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">
                  {vehicle.make} {vehicle.model}
                </span>
                {vehicle.year && (
                  <span className="text-sm text-muted-foreground">({vehicle.year})</span>
                )}
                {localVehicle && (
                  <Badge variant="success" className="text-xs">Connu</Badge>
                )}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {plate && <span className="font-mono tracking-wider uppercase">{plate}</span>}
                {vehicle.engineCode && <span>Moteur : {vehicle.engineCode}</span>}
                {fuelLabel && <span>{fuelLabel}</span>}
                {vehicle.displacement && <span>{vehicle.displacement} cc</span>}
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
