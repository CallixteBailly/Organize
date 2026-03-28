import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/server/middleware/with-auth";
import type { AuthContext } from "@/server/middleware/with-auth";
import { suggestDiagnosis } from "@/lib/ai/ai-service";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";
import { AIDisabledError, AIRateLimitError } from "@/lib/ai/errors";
import { getRepairOrderById } from "@/server/services/repair-order.service";
import { getVehicleById } from "@/server/services/vehicle.service";
import { db } from "@/lib/db";
import { garages, repairOrders, repairOrderLines, stockItems } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { formatDate } from "@/lib/utils/format";

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
  const roId = segments[segments.indexOf("repair-orders") + 1];

  if (!roId) {
    return NextResponse.json({ error: "ID de l'OR requis" }, { status: 400 });
  }

  const roData = await getRepairOrderById(ctx.garageId, roId);
  if (!roData) {
    return NextResponse.json({ error: "OR non trouvé" }, { status: 404 });
  }

  const { repairOrder: ro } = roData;
  if (!ro.customerComplaint) {
    return NextResponse.json({ error: "Aucune plainte client renseignée" }, { status: 400 });
  }

  // Récupérer les infos complètes du véhicule (motorisation, année)
  const vehicle = await getVehicleById(ctx.garageId, ro.vehicleId);

  // Récupérer les paramètres du garage (taux MO)
  const [garage] = await db.select().from(garages).where(eq(garages.id, ctx.garageId)).limit(1);
  const laborRate = garage?.settings?.laborHourlyRate ?? 50;

  // Historique des interventions précédentes sur ce véhicule
  const previousROs = await db
    .select()
    .from(repairOrders)
    .where(and(
      eq(repairOrders.vehicleId, ro.vehicleId),
      eq(repairOrders.garageId, ctx.garageId),
    ))
    .orderBy(desc(repairOrders.createdAt))
    .limit(10);

  const repairHistory = previousROs
    .filter((r: typeof previousROs[number]) => r.id !== roId)
    .map((r: typeof previousROs[number]) => {
      const desc = r.customerComplaint ?? r.workPerformed ?? r.diagnosis ?? `OR ${r.repairOrderNumber}`;
      const km = r.mileageAtIntake ? ` (${r.mileageAtIntake.toLocaleString("fr-FR")} km)` : "";
      return `${formatDate(r.createdAt)} — ${desc}${km}`;
    });

  // Pièces disponibles en stock (pertinentes pour le diagnostic)
  const stock = await db
    .select({ name: stockItems.name })
    .from(stockItems)
    .where(and(eq(stockItems.garageId, ctx.garageId), eq(stockItems.isActive, true)))
    .limit(30);

  try {
    const diagnosis = await suggestDiagnosis({
      customerComplaint: ro.customerComplaint,
      vehicleBrand: roData.vehicleBrand,
      vehicleModel: roData.vehicleModel,
      vehicleYear: vehicle?.year,
      vehicleEngine: vehicle?.engineType,
      mileage: ro.mileageAtIntake,
      existingLines: roData.lines.map((l: { description: string }) => l.description),
      repairHistory: repairHistory.length > 0 ? repairHistory : undefined,
      availableParts: stock.length > 0 ? stock.map((s: typeof stock[number]) => s.name) : undefined,
      laborRate,
    });

    return NextResponse.json({ diagnosis });
  } catch (err) {
    if (err instanceof AIDisabledError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Erreur interne";
    console.error("[Diagnostic IA] Erreur:", message);
    return NextResponse.json({ error: "Erreur lors de la génération du diagnostic" }, { status: 500 });
  }
}

export const POST = withAuth(handler);
