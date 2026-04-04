"use server";

import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoices, customers, garages } from "@/lib/db/schema";
import {
  createInvoiceSchema,
  invoiceLineSchema,
  recordPaymentSchema,
} from "@/server/validators/invoice";
import {
  createInvoice,
  generateInvoiceFromRepairOrder,
  getInvoiceById,
  addInvoiceLine,
  removeInvoiceLine,
  finalizeInvoice,
  recordPayment,
  generateFECExport,
} from "@/server/services/invoice.service";
import {
  sendInvoiceEmail,
  sendPaymentConfirmationEmail,
} from "@/server/services/email.service";
import { notifyPaymentReceived } from "@/server/services/notification.service";
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
    // Verify invoice is still a draft before allowing line removal (NF525 integrity)
    const invoiceData = await getInvoiceById(session.user.garageId, invoiceId);
    if (!invoiceData) return { success: false, error: "Facture introuvable" };
    if (invoiceData.invoice.status !== "draft") {
      return { success: false, error: "Impossible de modifier une facture finalisee" };
    }

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

    getInvoiceById(session.user.garageId, parsed.data.invoiceId).then(async (data) => {
      if (!data) return;
      const { invoice } = data;

      notifyPaymentReceived(
        session.user.garageId,
        {
          invoiceNumber: invoice.invoiceNumber,
          invoiceId: invoice.id,
          amount: parsed.data.amount,
          method: parsed.data.method,
        },
        session.user.id,
      ).catch((err) => console.error("[payment] Erreur notification:", err));

      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, invoice.customerId))
        .limit(1);
      const [garage] = await db
        .select()
        .from(garages)
        .where(eq(garages.id, session.user.garageId))
        .limit(1);
      if (customer?.email && garage) {
        sendPaymentConfirmationEmail({
          to: customer.email,
          customerName: invoice.customerName,
          invoiceNumber: invoice.invoiceNumber,
          amountPaid: parsed.data.amount.toFixed(2),
          paymentMethod: parsed.data.method,
          garageName: garage.name,
        }).catch((err) => console.error("[payment] Erreur envoi email confirmation:", err));
      }
    }).catch((err) => console.error("[payment] Erreur post-paiement:", err));

    revalidatePath(`/invoices/${parsed.data.invoiceId}`);
    revalidatePath("/invoices");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement du paiement" };
  }
}

// ── Send Invoice by Email ──

export async function sendInvoiceAction(
  invoiceId: string,
  via: "email" | "sms" = "email",
): Promise<InvoiceActionState> {
  const session = await auth();
  if (!session?.user || !["owner", "manager", "secretary"].includes(session.user.role)) {
    return { success: false, error: "Acces refuse" };
  }

  try {
    const data = await getInvoiceById(session.user.garageId, invoiceId);
    if (!data) return { success: false, error: "Facture introuvable" };

    const { invoice } = data;
    if (invoice.status === "draft") {
      return { success: false, error: "Impossible d'envoyer un brouillon. Finalisez d'abord la facture." };
    }

    // TODO [LOI FRANCAISE - Facturation electronique 2026]:
    // A partir de septembre 2026, les factures B2B doivent etre transmises via PDP/PPF
    // au format Factur-X (PDF/A-3 + XML). Le simple envoi par email ne sera plus suffisant
    // pour les clients assujettis TVA en France (presence de SIRET/TVA intra).
    // Verifier invoice.customerSiret / invoice.customerVatNumber avant envoi.
    // Ref: https://www.impots.gouv.fr/facturation-electronique

    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, invoice.customerId), eq(customers.garageId, session.user.garageId)))
      .limit(1);

    if (!customer?.email) {
      return { success: false, error: "Le client n'a pas d'adresse email renseignee" };
    }

    const [garage] = await db
      .select()
      .from(garages)
      .where(eq(garages.id, session.user.garageId))
      .limit(1);

    if (via === "email") {
      await sendInvoiceEmail({
        to: customer.email,
        customerName: invoice.customerName,
        invoiceNumber: invoice.invoiceNumber,
        totalTtc: invoice.totalTtc,
        dueDate: invoice.dueDate,
        garageName: garage?.name ?? "Garage",
        garageEmail: garage?.email ?? undefined,
        pdfUrl: invoice.pdfUrl ?? undefined,
      });
    }

    // Mettre a jour la facture comme envoyee
    await db
      .update(invoices)
      .set({
        status: invoice.status === "finalized" ? "sent" : invoice.status,
        sentAt: new Date(),
        sentVia: via,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur lors de l'envoi";
    return { success: false, error: msg };
  }
}
