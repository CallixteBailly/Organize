import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/server/middleware/with-auth";
import type { AuthContext } from "@/server/middleware/with-auth";
import { draftCustomerMessage } from "@/lib/ai/ai-service";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";
import { AIDisabledError, AIRateLimitError } from "@/lib/ai/errors";
import { getCustomerById } from "@/server/services/customer.service";
import { db } from "@/lib/db";
import { garages, vehicles, repairOrders, quotes } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import type { MessageType } from "@/lib/ai/prompts/message-draft-prompt";

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
  const customerId = segments[segments.indexOf("customers") + 1];

  let body: { type: MessageType };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de la requête invalide" }, { status: 400 });
  }

  if (!["vehicle_ready", "maintenance_reminder", "quote_followup"].includes(body.type)) {
    return NextResponse.json({ error: "Type de message invalide" }, { status: 400 });
  }

  const customer = await getCustomerById(ctx.garageId, customerId);
  if (!customer) {
    return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
  }

  const customerName = customer.companyName
    ?? [customer.firstName, customer.lastName].filter(Boolean).join(" ")
    ?? "Client";

  // Récupérer les infos du garage
  const [garage] = await db.select().from(garages).where(eq(garages.id, ctx.garageId)).limit(1);

  // Récupérer les véhicules du client
  const customerVehicles = await db
    .select({ brand: vehicles.brand, model: vehicles.model, licensePlate: vehicles.licensePlate })
    .from(vehicles)
    .where(and(eq(vehicles.customerId, customerId), eq(vehicles.garageId, ctx.garageId)))
    .limit(5);

  const vehicleDescriptions = customerVehicles.map(
    (v: typeof customerVehicles[number]) => [v.brand, v.model, v.licensePlate].filter(Boolean).join(" "),
  );

  // Dernière intervention
  const [lastRO] = await db
    .select()
    .from(repairOrders)
    .where(and(eq(repairOrders.customerId, customerId), eq(repairOrders.garageId, ctx.garageId)))
    .orderBy(desc(repairOrders.createdAt))
    .limit(1);

  // Devis en attente
  const [pendingQuote] = await db
    .select()
    .from(quotes)
    .where(and(
      eq(quotes.customerId, customerId),
      eq(quotes.garageId, ctx.garageId),
      inArray(quotes.status, ["draft", "sent"]),
    ))
    .orderBy(desc(quotes.createdAt))
    .limit(1);

  try {
    const message = await draftCustomerMessage({
      type: body.type,
      customerName,
      customerType: customer.type ?? undefined,
      garageName: garage?.name ?? undefined,
      garagePhone: garage?.phone ?? undefined,
      vehicles: vehicleDescriptions.length > 0 ? vehicleDescriptions : undefined,
      lastRepairDate: lastRO ? formatDate(lastRO.createdAt) : undefined,
      lastRepairDescription: lastRO?.customerComplaint ?? lastRO?.workPerformed ?? undefined,
      pendingQuoteAmount: pendingQuote ? pendingQuote.totalTtc : undefined,
      pendingQuoteDescription: pendingQuote?.notes ?? undefined,
    });

    return NextResponse.json({ message });
  } catch (err) {
    if (err instanceof AIDisabledError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Erreur interne";
    console.error("[Message Draft IA] Erreur:", message);
    return NextResponse.json({ error: "Erreur lors de la rédaction du message" }, { status: 500 });
  }
}

export const POST = withAuth(handler);
