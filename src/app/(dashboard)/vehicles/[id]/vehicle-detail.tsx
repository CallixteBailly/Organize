"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Car, User, Gauge, Calendar, Fuel, Palette, Hash, Wrench } from "lucide-react";

interface Vehicle {
  id: string;
  licensePlate: string | null;
  vin: string | null;
  brand: string | null;
  model: string | null;
  version: string | null;
  year: number | null;
  engineType: string | null;
  mileage: number | null;
  color: string | null;
  notes: string | null;
}

interface Props {
  vehicle: Vehicle;
  customerName: string;
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Car; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function VehicleDetail({ vehicle, customerName }: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle>
              {vehicle.brand} {vehicle.model}
            </CardTitle>
            {vehicle.licensePlate && (
              <Badge variant="outline" className="font-mono text-base">
                {vehicle.licensePlate}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <InfoRow icon={User} label="Proprietaire" value={customerName} />
          <InfoRow icon={Car} label="Version" value={vehicle.version} />
          <InfoRow icon={Calendar} label="Annee" value={vehicle.year?.toString()} />
          <InfoRow icon={Fuel} label="Motorisation" value={vehicle.engineType} />
          <InfoRow icon={Gauge} label="Kilometrage" value={vehicle.mileage ? `${vehicle.mileage.toLocaleString("fr-FR")} km` : null} />
          <InfoRow icon={Palette} label="Couleur" value={vehicle.color} />
          <InfoRow icon={Hash} label="VIN" value={vehicle.vin} />
        </CardContent>
      </Card>

      {vehicle.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{vehicle.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Placeholder pour l'historique d'interventions - sera rempli en Phase 5 */}
      <Card>
        <CardHeader>
          <CardTitle>Historique interventions</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Wrench}
            title="Aucune intervention"
            description="L'historique des interventions apparaitra ici"
            className="py-6"
          />
        </CardContent>
      </Card>
    </div>
  );
}
