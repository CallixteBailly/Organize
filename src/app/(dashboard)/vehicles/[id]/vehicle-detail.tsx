"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAI } from "@/components/ai/ai-provider";
import { Car, User, Gauge, Calendar, Fuel, Palette, Hash, Wrench, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const { isEnabled: aiEnabled } = useAI();

  async function handleSummary() {
    setSummarizing(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/repair-summary`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setSummary(data.summary);
      toast.success("Résumé généré");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur IA");
    } finally {
      setSummarizing(false);
    }
  }

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

      {/* Historique interventions + résumé IA */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Historique interventions</CardTitle>
          {aiEnabled && !summary && (
            <Button variant="outline" size="sm" onClick={handleSummary} disabled={summarizing}>
              {summarizing ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Analyse...</>
              ) : (
                <><Zap className="h-3 w-3" /> Générer le résumé</>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {summary ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
                <Zap className="h-3 w-3" /> Résumé généré par l&apos;IA
              </div>
              <div className="whitespace-pre-line text-sm">{summary}</div>
            </div>
          ) : (
            <EmptyState
              icon={Wrench}
              title="Aucune intervention"
              description="L'historique des interventions apparaitra ici"
              className="py-6"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
