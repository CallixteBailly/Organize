import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/server/middleware/with-auth";
import type { AuthContext } from "@/server/middleware/with-auth";
import { quickCaptureInputSchema } from "@/server/validators/quick-capture";
import { parseQuickCapture } from "@/server/services/quick-capture.service";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";
import { AIDisabledError, AIRateLimitError, AIConfigError, AIParseError } from "@/lib/ai/errors";

async function handler(req: NextRequest, ctx: AuthContext) {
  // Rate limiting
  try {
    await checkAIRateLimit(ctx.userId);
  } catch (err) {
    if (err instanceof AIRateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de la requête invalide" }, { status: 400 });
  }

  const parsed = quickCaptureInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  }

  try {
    const preview = await parseQuickCapture(ctx.garageId, parsed.data.text);
    return NextResponse.json(preview);
  } catch (err) {
    if (err instanceof AIDisabledError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof AIConfigError) {
      return NextResponse.json({ error: "Service IA non configuré" }, { status: 500 });
    }
    if (err instanceof AIParseError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    const message = err instanceof Error ? err.message : "Erreur interne";
    console.error("[Quick Capture] Erreur:", message);
    if (message.includes("timeout") || message.includes("trop de temps")) {
      return NextResponse.json({ error: "L'analyse a pris trop de temps. Réessayez." }, { status: 504 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withAuth(handler);
