import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/server/middleware/with-auth";
import { vehicleModelSearchSchema } from "@/server/validators/catalog";
import { resolveVehicleByModel, CatalogDisabledError, CatalogProviderError } from "@/lib/catalog";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";

async function handler(req: NextRequest, ctx: AuthContext) {
  const make = req.nextUrl.searchParams.get("make") ?? "";
  const model = req.nextUrl.searchParams.get("model") ?? "";
  const rawYear = req.nextUrl.searchParams.get("year");
  const fuelType = req.nextUrl.searchParams.get("fuelType");

  const parsed = vehicleModelSearchSchema.safeParse({
    make,
    model,
    year: rawYear ?? undefined,
    fuelType: fuelType || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Paramètres invalides" },
      { status: 400 },
    );
  }

  try {
    await checkAIRateLimit(`catalog:${ctx.userId}`);
  } catch {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans quelques secondes." },
      { status: 429 },
    );
  }

  try {
    const vehicle = await resolveVehicleByModel(parsed.data);
    if (!vehicle) {
      return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });
    }
    return NextResponse.json({ vehicle });
  } catch (err) {
    if (err instanceof CatalogDisabledError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof CatalogProviderError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[catalog/model-search]", err);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

export const GET = withAuth(handler);
