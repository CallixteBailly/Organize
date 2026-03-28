import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/server/middleware/with-auth";
import { getPartsWithCache, CatalogDisabledError, CatalogProviderError } from "@/lib/catalog";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";

async function handler(req: NextRequest, ctx: AuthContext) {
  const rawKTypeId = req.nextUrl.searchParams.get("kTypeId");

  if (!rawKTypeId) {
    return NextResponse.json({ error: "Le paramètre kTypeId est requis" }, { status: 400 });
  }

  const kTypeId = parseInt(rawKTypeId, 10);
  if (isNaN(kTypeId) || kTypeId <= 0) {
    return NextResponse.json({ error: "kTypeId invalide" }, { status: 400 });
  }

  try {
    await checkAIRateLimit(`catalog:${ctx.userId}`);
  } catch {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez dans quelques secondes." }, { status: 429 });
  }

  try {
    const categories = await getPartsWithCache(kTypeId);
    return NextResponse.json({ categories });
  } catch (err) {
    if (err instanceof CatalogDisabledError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof CatalogProviderError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[catalog/parts]", err);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

export const GET = withAuth(handler);
