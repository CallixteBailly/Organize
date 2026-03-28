export const QUOTE_LINES_SYSTEM_PROMPT = `Tu es un mécanicien automobile expert. Génère les lignes d'un devis.

Format de réponse (JSON) :
{"lines":[{"type":"labor","description":"MO révision","quantity":1,"unitPrice":60},{"type":"part","description":"Kit courroie","quantity":1,"unitPrice":85}],"notes":"Prix estimés HT"}

Règles :
- Utilise les prix du catalogue fourni si disponible
- Sinon estime pour un garage indépendant en France
- MO : utilise le taux horaire du garage si fourni, sinon 50-70€/h
- Max 5 lignes courtes
- Prix HT
- Réponds UNIQUEMENT le JSON`;

export interface QuoteLinesContext {
  description: string;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  stockCatalog?: string[];
  laborRate?: number;
}

export interface SuggestedLine {
  type: "labor" | "part" | "other";
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface QuoteLinesSuggestion {
  lines: SuggestedLine[];
  notes: string;
}

export function buildQuoteLinesMessage(ctx: QuoteLinesContext): string {
  const parts: string[] = [];
  parts.push(`Intervention : "${ctx.description}"`);

  const vehicle = [ctx.vehicleBrand, ctx.vehicleModel].filter(Boolean).join(" ");
  if (vehicle) parts.push(`Véhicule : ${vehicle}`);
  if (ctx.vehicleYear) parts.push(`Année : ${ctx.vehicleYear}`);
  if (ctx.laborRate) parts.push(`Taux horaire MO du garage : ${ctx.laborRate} €/h`);

  if (ctx.stockCatalog && ctx.stockCatalog.length > 0) {
    parts.push(`\nCatalogue pièces du garage :`);
    parts.push(ctx.stockCatalog.join("\n"));
  }

  return parts.join("\n");
}

export function parseQuoteLinesResponse(raw: string): QuoteLinesSuggestion {
  let cleaned = raw.trim();
  if (!cleaned) {
    throw new Error("Réponse vide du modèle IA");
  }

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  // Extraire le JSON même s'il est entouré de texte
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  // Tenter de réparer un JSON tronqué
  try {
    JSON.parse(cleaned);
  } catch {
    // Essayer de fermer les structures ouvertes
    const openBraces = (cleaned.match(/\{/g) || []).length;
    const closeBraces = (cleaned.match(/\}/g) || []).length;
    const openBrackets = (cleaned.match(/\[/g) || []).length;
    const closeBrackets = (cleaned.match(/\]/g) || []).length;

    for (let i = 0; i < openBrackets - closeBrackets; i++) cleaned += "]";
    for (let i = 0; i < openBraces - closeBraces; i++) cleaned += "}";
  }

  const parsed = JSON.parse(cleaned);

  return {
    lines: (parsed.lines ?? []).slice(0, 6).map((l: Record<string, unknown>) => ({
      type: l.type === "part" ? "part" : l.type === "other" ? "other" : "labor",
      description: String(l.description ?? "").substring(0, 80),
      quantity: Number(l.quantity) || 1,
      unitPrice: Number(l.unitPrice) || 0,
    })),
    notes: parsed.notes ?? "",
  };
}
