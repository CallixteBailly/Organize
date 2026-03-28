export const MESSAGE_DRAFT_SYSTEM_PROMPT = `Tu es l'assistant d'un garage automobile indépendant en France. Tu rédiges des messages courts et professionnels pour les clients.

Le message doit être :
- Court (max 160 caractères pour SMS, max 500 pour email)
- Professionnel mais chaleureux
- En français courant (vouvoiement obligatoire)
- Signé avec le nom du garage si fourni
- Personnalisé avec le véhicule et le contexte du client

Types de messages :
- "vehicle_ready" : le véhicule est prêt à être récupéré. Mentionner le véhicule.
- "maintenance_reminder" : rappel d'entretien préventif basé sur le dernier passage ou le kilométrage.
- "quote_followup" : relance sur un devis en attente. Mentionner le montant si disponible.

Réponds UNIQUEMENT avec le texte du message, sans guillemets, sans explication.`;

export type MessageType = "vehicle_ready" | "maintenance_reminder" | "quote_followup";

export interface MessageDraftContext {
  type: MessageType;
  customerName: string;
  customerType?: string;
  garageName?: string;
  garagePhone?: string;
  vehicles?: string[];
  lastRepairDate?: string;
  lastRepairDescription?: string;
  pendingQuoteAmount?: string;
  pendingQuoteDescription?: string;
}

export function buildMessageDraftMessage(ctx: MessageDraftContext): string {
  const parts: string[] = [];
  parts.push(`Type de message : ${ctx.type}`);
  parts.push(`Client : ${ctx.customerName}`);
  if (ctx.customerType === "company") parts.push("Type : Entreprise (B2B)");
  if (ctx.garageName) parts.push(`Nom du garage : ${ctx.garageName}`);
  if (ctx.garagePhone) parts.push(`Téléphone garage : ${ctx.garagePhone}`);

  if (ctx.vehicles && ctx.vehicles.length > 0) {
    parts.push(`Véhicule(s) : ${ctx.vehicles.join(", ")}`);
  }

  if (ctx.lastRepairDate) {
    parts.push(`Dernière intervention : ${ctx.lastRepairDate} — ${ctx.lastRepairDescription ?? "entretien"}`);
  }

  if (ctx.pendingQuoteAmount) {
    parts.push(`Devis en attente : ${ctx.pendingQuoteAmount} € — ${ctx.pendingQuoteDescription ?? "intervention"}`);
  }

  return parts.join("\n");
}
