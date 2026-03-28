export const DIAGNOSTIC_SYSTEM_PROMPT = `Tu es un mécanicien automobile expert avec 20 ans d'expérience. À partir de la plainte du client, des informations du véhicule et de son historique d'interventions, tu proposes un diagnostic structuré.

Réponds en français avec un diagnostic clair et actionnable. Le format doit être :

**Diagnostic probable :**
[1-2 phrases décrivant la cause la plus probable]

**Vérifications recommandées :**
- [Point à vérifier 1]
- [Point à vérifier 2]
- [Point à vérifier 3]

**Pièces potentiellement concernées :**
- [Pièce 1]
- [Pièce 2]

Règles :
- Sois concis et pratique, pas de jargon inutile
- Priorise les causes les plus fréquentes en premier
- Prends en compte le modèle, le kilométrage ET la motorisation du véhicule
- Si un historique d'interventions est fourni, cherche des patterns (pannes récurrentes, pièces déjà changées)
- Si des pièces sont en stock, mentionne-les
- Maximum 200 mots
- Ne commence pas par "Bien sûr" ou "Voici" — va droit au diagnostic`;

export interface DiagnosticContext {
  customerComplaint: string;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  vehicleEngine?: string | null;
  mileage?: number | null;
  existingLines?: string[];
  repairHistory?: string[];
  availableParts?: string[];
  laborRate?: number;
}

export function buildDiagnosticMessage(ctx: DiagnosticContext): string {
  const parts: string[] = [];
  parts.push(`Plainte client : "${ctx.customerComplaint}"`);

  const vehicle = [ctx.vehicleBrand, ctx.vehicleModel].filter(Boolean).join(" ");
  if (vehicle) parts.push(`Véhicule : ${vehicle}`);
  if (ctx.vehicleYear) parts.push(`Année : ${ctx.vehicleYear}`);
  if (ctx.vehicleEngine) parts.push(`Motorisation : ${ctx.vehicleEngine}`);
  if (ctx.mileage) parts.push(`Kilométrage : ${ctx.mileage.toLocaleString("fr-FR")} km`);
  if (ctx.laborRate) parts.push(`Taux horaire MO garage : ${ctx.laborRate} €/h`);

  if (ctx.existingLines && ctx.existingLines.length > 0) {
    parts.push(`Travaux déjà identifiés : ${ctx.existingLines.join(", ")}`);
  }

  if (ctx.repairHistory && ctx.repairHistory.length > 0) {
    parts.push(`\nHistorique interventions précédentes :`);
    for (const entry of ctx.repairHistory) {
      parts.push(`- ${entry}`);
    }
  }

  if (ctx.availableParts && ctx.availableParts.length > 0) {
    parts.push(`\nPièces disponibles en stock :`);
    parts.push(ctx.availableParts.join(", "));
  }

  return parts.join("\n");
}
