import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/server/middleware/with-auth";
import type { AuthContext } from "@/server/middleware/with-auth";
import { suggestQuoteLines } from "@/lib/ai/ai-service";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";
import { AIDisabledError, AIRateLimitError } from "@/lib/ai/errors";
import { getQuoteById } from "@/server/services/quote.service";
import { db } from "@/lib/db";
import { stockItems, garages, vehicles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function handler(req: NextRequest, ctx: AuthContext) {
  try {
    await checkAIRateLimit(ctx.userId);
  } catch (err) {
    if (err instanceof AIRateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
  }

  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const quoteId = segments[segments.indexOf("quotes") + 1];

  if (!quoteId) {
    return NextResponse.json({ error: "ID du devis requis" }, { status: 400 });
  }

  const quoteData = await getQuoteById(ctx.garageId, quoteId);
  if (!quoteData) {
    return NextResponse.json({ error: "Devis non trouvé" }, { status: 404 });
  }

  const { quote } = quoteData;
  if (!quote.notes) {
    return NextResponse.json({ error: "Aucune description dans les notes du devis" }, { status: 400 });
  }

  // Taux MO du garage
  const [garage] = await db.select().from(garages).where(eq(garages.id, ctx.garageId)).limit(1);
  const laborRate = garage?.settings?.laborHourlyRate ?? 50;

  // Véhicule lié au devis (si existant)
  let vehicleBrand: string | null = null;
  let vehicleModel: string | null = null;
  let vehicleYear: number | null = null;
  if (quote.vehicleId) {
    const vehicle = await db
      .select({ brand: vehicles.brand, model: vehicles.model, year: vehicles.year })
      .from(vehicles)
      .where(eq(vehicles.id, quote.vehicleId))
      .limit(1);
    if (vehicle[0]) {
      vehicleBrand = vehicle[0].brand;
      vehicleModel = vehicle[0].model;
      vehicleYear = vehicle[0].year;
    }
  }

  // Catalogue stock avec prix réels
  const stock = await db
    .select({
      name: stockItems.name,
      reference: stockItems.reference,
      sellingPrice: stockItems.sellingPrice,
    })
    .from(stockItems)
    .where(and(eq(stockItems.garageId, ctx.garageId), eq(stockItems.isActive, true)))
    .limit(50);

  const stockCatalog = stock.map((s: typeof stock[number]) => `${s.name} (ref: ${s.reference}) — ${s.sellingPrice} € HT`);

  try {
    const suggestion = await suggestQuoteLines({
      description: quote.notes,
      vehicleBrand,
      vehicleModel,
      vehicleYear,
      stockCatalog: stockCatalog.length > 0 ? stockCatalog : undefined,
      laborRate,
    });

    return NextResponse.json(suggestion);
  } catch (err) {
    if (err instanceof AIDisabledError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Erreur interne";
    console.error("[Quote Lines IA] Erreur:", message);
    return NextResponse.json({ error: "Erreur lors de la génération des lignes" }, { status: 500 });
  }
}

export const POST = withAuth(handler);
