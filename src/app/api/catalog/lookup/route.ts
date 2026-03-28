import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/server/middleware/with-auth";
import { plateSearchSchema } from "@/server/validators/catalog";
import { resolvePlateWithCache, CatalogDisabledError, CatalogProviderError, CatalogNotFoundError } from "@/lib/catalog";
import { searchVehicleByPlate } from "@/server/services/vehicle.service";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";

async function handler(req: NextRequest, ctx: AuthContext) {
  const rawPlate = req.nextUrl.searchParams.get("plate") ?? "";

  const parsed = plateSearchSchema.safeParse({ plate: rawPlate });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Plaque invalide" },
      { status: 400 },
    );
  }

  const plate = parsed.data.plate;

  try {
    await checkAIRateLimit(`catalog:${ctx.userId}`);
  } catch {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez dans quelques secondes." }, { status: 429 });
  }

  try {
    const vehicle = await resolvePlateWithCache(plate);

    if (!vehicle) {
      return NextResponse.json(
        { error: `Véhicule introuvable pour la plaque ${rawPlate.toUpperCase()}` },
        { status: 404 },
      );
    }

    // Cross-référence avec les véhicules du garage
    const localVehicles = await searchVehicleByPlate(ctx.garageId, plate);
    const localVehicle = localVehicles[0] ?? null;

    return NextResponse.json({
      vehicle,
      localVehicleId: localVehicle?.id ?? null,
      localVehicle: localVehicle
        ? {
            id: localVehicle.id,
            brand: localVehicle.brand,
            model: localVehicle.model,
            year: localVehicle.year,
            licensePlate: localVehicle.licensePlate,
          }
        : null,
    });
  } catch (err) {
    if (err instanceof CatalogDisabledError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof CatalogNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof CatalogProviderError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[catalog/lookup]", err);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

export const GET = withAuth(handler);
