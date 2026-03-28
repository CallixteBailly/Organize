"use server";

import { auth } from "@/lib/auth";
import {
  createInvoiceSchema,
  invoiceLineSchema,
  recordPaymentSchema,
} from "@/server/validators/invoice";
import {
  createInvoice,
  generateInvoiceFromRepairOrder,
  addInvoiceLine,
  removeInvoiceLine,
  finalizeInvoice,
  recordPayment,
  generateFECExport,
} from "@/server/services/invoice.service";
import { revalidatePath } from "next/cache";

export type InvoiceActionState = {
  success: boolean;
  error?: string;
  invoiceId?: string;
};

export async function createInvoiceAction(
  _prevState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const session = await auth();
  if (!session?.user || !["owner", "manager", "secretary"].includes(session.user.role)) {
    return { success: false, error: "Acces refuse" };
  }

  const raw = Object.fromEntries(formData);
  const parsed = createInvoiceSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  try {
    const invoice = await createInvoice(session.user.garageId, session.user.id, parsed.data);
    revalidatePath("/invoices");
    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur lors de la creation";
    return { success: false, error: msg };
  }
}

export async function generateFromRepairOrderAction(roId: string): Promise<InvoiceActionState> {
  const session = await auth();
  if (!session?.user || !["owner", "manager", "secretary"].includes(session.user.role)) {
    return { success: false, error: "Acces refuse" };
  }

  try {
    const invoice = await generateInvoiceFromRepairOrder(
      session.user.garageId,
      roId,
      session.user.id,
    );
    revalidatePath("/invoices");
    revalidatePath(`/repair-orders/${roId}`);
    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur lors de la generation";
    return { success: false, error: msg };
  }
}

export async function addInvoiceLineAction(
  _prevState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const raw = Object.fromEntries(formData);
  const parsed = invoiceLineSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  try {
    await addInvoiceLine(session.user.garageId, parsed.data);
    revalidatePath(`/invoices/${parsed.data.invoiceId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'ajout" };
  }
}

export async function removeInvoiceLineAction(
  lineId: string,
  invoiceId: string,
): Promise<InvoiceActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  try {
    await removeInvoiceLine(lineId, invoiceId, session.user.garageId);
    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression" };
  }
}

export async function finalizeInvoiceAction(invoiceId: string): Promise<InvoiceActionState> {
  const session = await auth();
  if (!session?.user || !["owner", "manager"].includes(session.user.role)) {
    return { success: false, error: "Seul un gerant peut finaliser une facture" };
  }

  try {
    await finalizeInvoice(session.user.garageId, invoiceId);
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur lors de la finalisation";
    return { success: false, error: msg };
  }
}

export async function recordPaymentAction(
  _prevState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const raw = Object.fromEntries(formData);
  const parsed = recordPaymentSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  try {
    await recordPayment(session.user.garageId, parsed.data);
    revalidatePath(`/invoices/${parsed.data.invoiceId}`);
    revalidatePath("/invoices");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement du paiement" };
  }
}
