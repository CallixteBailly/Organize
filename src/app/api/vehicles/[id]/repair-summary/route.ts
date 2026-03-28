import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/server/middleware/with-auth";
import type { AuthContext } from "@/server/middleware/with-auth";
import { summarizeVehicleHistory } from "@/lib/ai/ai-service";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";
import { AIDisabledError, AIRateLimitError } from "@/lib/ai/errors";
import { getVehicleById } from "@/server/services/vehicle.service";
import { db } from "@/lib/db";
import { repairOrders, repairOrderLines } from "@/lib/db/schema";
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
  const vehicleId = segments[segments.indexOf("vehicles") + 1];

  if (!vehicleId) {
    return NextResponse.json({ error: "ID du véhicule requis" }, { status: 400 });
  }

  const vehicle = await getVehicleById(ctx.garageId, vehicleId);
  if (!vehicle) {
    return NextResponse.json({ error: "Véhicule non trouvé" }, { status: 404 });
  }

  // Fetch all repair orders for this vehicle
  const ros = await db
    .select()
    .from(repairOrders)
    .where(and(eq(repairOrders.vehicleId, vehicleId), eq(repairOrders.garageId, ctx.garageId)))
    .orderBy(desc(repairOrders.createdAt));

  const history = ros.map((ro: typeof ros[number]) => ({
    date: formatDate(ro.createdAt),
    description: ro.customerComplaint ?? ro.workPerformed ?? `OR ${ro.repairOrderNumber}`,
    mileage: ro.mileageAtIntake,
    totalTtc: ro.totalTtc,
  }));

  try {
    const summary = await summarizeVehicleHistory({
      vehicleBrand: vehicle.brand,
      vehicleModel: vehicle.model,
      vehicleYear: vehicle.year,
      currentMileage: vehicle.mileage,
      history,
    });

    return NextResponse.json({ summary });
  } catch (err) {
    if (err instanceof AIDisabledError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Erreur interne";
    console.error("[Vehicle Summary IA] Erreur:", message);
    return NextResponse.json({ error: "Erreur lors de la génération du résumé" }, { status: 500 });
  }
}

export const GET = withAuth(handler);
