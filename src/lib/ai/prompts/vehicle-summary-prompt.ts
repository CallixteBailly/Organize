export const VEHICLE_SUMMARY_SYSTEM_PROMPT = `Tu es un conseiller technique automobile. À partir de l'historique d'interventions d'un véhicule, génère un résumé structuré et utile pour le mécanicien et le client.

Réponds en français avec un résumé clair. Format :

**Résumé du véhicule :**
[1-2 phrases sur l'état général du véhicule basé sur l'historique]

**Interventions clés :**
- [Date] — [Intervention] ([Montant])
- ...

**Dépenses totales :** [Montant total]

**Prochains entretiens recommandés :**
- [Entretien 1] (basé sur le kilométrage ou la date)
- [Entretien 2]

Règles :
- Sois concis et pratique
- Identifie les patterns (pièces changées régulièrement)
- Suggère les entretiens préventifs basés sur le kilométrage actuel et l'historique
- Si peu d'historique, indique-le et suggère les entretiens de base
- Maximum 250 mots
- Ne commence pas par "Voici" — va droit au résumé`;

export interface VehicleHistoryEntry {
  date: string;
  description: string;
  mileage?: number | null;
  totalTtc: string;
}

export interface VehicleSummaryContext {
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  currentMileage?: number | null;
  history: VehicleHistoryEntry[];
}

export function buildVehicleSummaryMessage(ctx: VehicleSummaryContext): string {
  const parts: string[] = [];

  const vehicle = [ctx.vehicleBrand, ctx.vehicleModel].filter(Boolean).join(" ");
  if (vehicle) parts.push(`Véhicule : ${vehicle}`);
  if (ctx.vehicleYear) parts.push(`Année : ${ctx.vehicleYear}`);
  if (ctx.currentMileage) parts.push(`Kilométrage actuel : ${ctx.currentMileage.toLocaleString("fr-FR")} km`);

  if (ctx.history.length === 0) {
    parts.push("Historique : aucune intervention enregistrée");
  } else {
    parts.push(`\nHistorique des interventions (${ctx.history.length}) :`);
    for (const entry of ctx.history) {
      const km = entry.mileage ? ` — ${entry.mileage.toLocaleString("fr-FR")} km` : "";
      parts.push(`- ${entry.date} : ${entry.description} (${entry.totalTtc} €${km})`);
    }
  }

  return parts.join("\n");
}
