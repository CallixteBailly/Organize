"use server";

import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quotes, customers, garages } from "@/lib/db/schema";
import { createQuoteSchema, quoteLineSchema } from "@/server/validators/quote";
import {
  createQuote,
  getQuoteById,
  addQuoteLine,
  removeQuoteLine,
  convertQuoteToRepairOrder,
} from "@/server/services/quote.service";
import { sendQuoteEmail } from "@/server/services/email.service";
import { revalidatePath } from "next/cache";

export type QuoteActionState = {
  success: boolean;
  error?: string;
  quoteId?: string;
  repairOrderId?: string;
};

export async function createQuoteAction(
  _prevState: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const raw = Object.fromEntries(formData);
  const parsed = createQuoteSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  try {
    const quote = await createQuote(session.user.garageId, session.user.id, parsed.data);
    revalidatePath("/quotes");
    return { success: true, quoteId: quote.id };
  } catch {
    return { success: false, error: "Erreur lors de la creation du devis" };
  }
}

export async function addQuoteLineAction(
  _prevState: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const raw = Object.fromEntries(formData);
  const parsed = quoteLineSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  try {
    await addQuoteLine(session.user.garageId, parsed.data);
    revalidatePath(`/quotes/${parsed.data.quoteId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'ajout de la ligne" };
  }
}

export async function removeQuoteLineAction(
  lineId: string,
  quoteId: string,
): Promise<QuoteActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  try {
    await removeQuoteLine(lineId, quoteId, session.user.garageId);
    revalidatePath(`/quotes/${quoteId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression" };
  }
}

export async function convertQuoteAction(quoteId: string): Promise<QuoteActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  try {
    const ro = await convertQuoteToRepairOrder(
      session.user.garageId,
      quoteId,
      session.user.id,
    );
    revalidatePath(`/quotes/${quoteId}`);
    revalidatePath("/repair-orders");
    return { success: true, repairOrderId: ro.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur lors de la conversion";
    return { success: false, error: msg };
  }
}

// ── Send Quote by Email ──

export async function sendQuoteAction(quoteId: string): Promise<QuoteActionState> {
  const session = await auth();
  if (!session?.user || !["owner", "manager", "secretary"].includes(session.user.role)) {
    return { success: false, error: "Acces refuse" };
  }

  try {
    const data = await getQuoteById(session.user.garageId, quoteId);
    if (!data) return { success: false, error: "Devis introuvable" };

    const { quote } = data;
    if (quote.status === "converted") {
      return { success: false, error: "Ce devis a deja ete converti en OR" };
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, quote.customerId), eq(customers.garageId, session.user.garageId)))
      .limit(1);

    if (!customer?.email) {
      return { success: false, error: "Le client n'a pas d'adresse email renseignee" };
    }

    const [garage] = await db
      .select()
      .from(garages)
      .where(eq(garages.id, session.user.garageId))
      .limit(1);

    const customerName = customer.companyName
      || [customer.firstName, customer.lastName].filter(Boolean).join(" ")
      || "Client";

    await sendQuoteEmail({
      to: customer.email,
      customerName,
      quoteNumber: quote.quoteNumber,
      totalTtc: quote.totalTtc,
      validUntil: quote.validUntil ?? undefined,
      garageName: garage?.name ?? "Garage",
      garageEmail: garage?.email ?? undefined,
    });

    // Mettre a jour le statut du devis
    await db
      .update(quotes)
      .set({
        status: quote.status === "draft" ? "sent" : quote.status,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId));

    revalidatePath(`/quotes/${quoteId}`);
    revalidatePath("/quotes");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur lors de l'envoi du devis";
    return { success: false, error: msg };
  }
}
