"use server";

import { auth } from "@/lib/auth";
import { createQuoteSchema, quoteLineSchema } from "@/server/validators/quote";
import {
  createQuote,
  addQuoteLine,
  removeQuoteLine,
  convertQuoteToRepairOrder,
} from "@/server/services/quote.service";
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
