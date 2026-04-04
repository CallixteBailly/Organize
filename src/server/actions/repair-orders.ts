"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers, vehicles, garages, repairOrders } from "@/lib/db/schema";
import {
  createRepairOrderSchema,
  updateRepairOrderSchema,
  repairOrderLineSchema,
  signatureSchema,
} from "@/server/validators/repair-order";
import {
  createRepairOrder,
  updateRepairOrder,
  addRepairOrderLine,
  removeRepairOrderLine,
  recordSignature,
  closeRepairOrder,
} from "@/server/services/repair-order.service";
import { generateInvoiceFromRepairOrder } from "@/server/services/invoice.service";
import { sendVehicleReadyEmail } from "@/server/services/email.service";
import { notifyRepairOrderCompleted, notifyRepairOrderAssigned } from "@/server/services/notification.service";
import { revalidatePath } from "next/cache";

export type RepairOrderActionState = {
  success: boolean;
  error?: string;
  warning?: string;
  repairOrderId?: string;
};

export async function createRepairOrderAction(
  _prevState: RepairOrderActionState,
  formData: FormData,
): Promise<RepairOrderActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const raw = Object.fromEntries(formData);
  const parsed = createRepairOrderSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  try {
    const ro = await createRepairOrder(session.user.garageId, session.user.id, parsed.data);
    revalidatePath("/repair-orders");
    return { success: true, repairOrderId: ro.id };
  } catch {
    return { success: false, error: "Erreur lors de la creation de l'OR" };
  }
}

export async function updateRepairOrderAction(
  _prevState: RepairOrderActionState,
  formData: FormData,
): Promise<RepairOrderActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const roId = formData.get("repairOrderId") as string;
  if (!roId) return { success: false, error: "OR non specifie" };

  const raw = Object.fromEntries(formData);
  const parsed = updateRepairOrderSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: "Donnees invalides" };
  }

  try {
    await updateRepairOrder(session.user.garageId, roId, parsed.data);

    // Notification si assignation (non bloquant)
    if (parsed.data.assignedTo && parsed.data.assignedTo !== "") {
      db.select()
        .from(repairOrders)
        .where(eq(repairOrders.id, roId))
        .limit(1)
        .then(([ro]) => {
          if (ro) {
            notifyRepairOrderAssigned(
              session.user.garageId,
              { id: ro.id, repairOrderNumber: ro.repairOrderNumber },
              parsed.data.assignedTo!,
              session.user.id,
            ).catch((err) => console.error("[updateRO] Erreur notification:", err));
          }
        })
        .catch((err) => console.error("[updateRO] Erreur fetch RO pour notification:", err));
    }

    revalidatePath(`/repair-orders/${roId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise a jour" };
  }
}

export async function addLineAction(
  _prevState: RepairOrderActionState,
  formData: FormData,
): Promise<RepairOrderActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const raw = Object.fromEntries(formData);
  const parsed = repairOrderLineSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  try {
    await addRepairOrderLine(session.user.garageId, parsed.data);
    revalidatePath(`/repair-orders/${parsed.data.repairOrderId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'ajout de la ligne" };
  }
}

export async function removeLineAction(
  lineId: string,
  repairOrderId: string,
): Promise<RepairOrderActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  try {
    await removeRepairOrderLine(lineId, repairOrderId, session.user.garageId);
    revalidatePath(`/repair-orders/${repairOrderId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression" };
  }
}

export async function recordSignatureAction(
  roId: string,
  signatureDataUrl: string,
): Promise<RepairOrderActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  try {
    await recordSignature(session.user.garageId, roId, signatureDataUrl);
    revalidatePath(`/repair-orders/${roId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement de la signature" };
  }
}

export async function closeRepairOrderAction(roId: string): Promise<RepairOrderActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  try {
    await closeRepairOrder(session.user.garageId, roId, session.user.id);

    // Notification intervention terminée (non bloquant)
    db.select()
      .from(repairOrders)
      .where(eq(repairOrders.id, roId))
      .limit(1)
      .then(([ro]) => {
        if (ro) {
          notifyRepairOrderCompleted(
            session.user.garageId,
            { id: ro.id, repairOrderNumber: ro.repairOrderNumber },
            session.user.id,
          ).catch((err) => console.error("[closeRO] Erreur notification:", err));
        }
      })
      .catch((err) => console.error("[closeRO] Erreur fetch RO pour notification:", err));

    // Auto-générer la facture depuis l'OR clôturé
    let invoiceId: string | undefined;
    let invoiceWarning: string | undefined;
    try {
      const invoice = await generateInvoiceFromRepairOrder(session.user.garageId, roId, session.user.id);
      invoiceId = invoice.id;
    } catch (err) {
      // La clôture a réussi mais la facture n'a pas pu être générée — on prévient l'utilisateur
      invoiceWarning = err instanceof Error
        ? `OR cloture mais la facture n'a pas pu etre generee : ${err.message}`
        : "OR cloture mais la facture n'a pas pu etre generee automatiquement";
    }

    // Envoi email "vehicule pret" au client (non bloquant)
    db.select()
      .from(repairOrders)
      .where(eq(repairOrders.id, roId))
      .limit(1)
      .then(async ([ro]) => {
        if (!ro) return;
        const [customer] = await db.select().from(customers).where(eq(customers.id, ro.customerId)).limit(1);
        const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, ro.vehicleId)).limit(1);
        const [garage] = await db.select().from(garages).where(eq(garages.id, session.user.garageId)).limit(1);
        if (customer?.email && vehicle && garage) {
          const vehicleDesc = [vehicle.brand, vehicle.model, vehicle.licensePlate].filter(Boolean).join(" ");
          sendVehicleReadyEmail({
            to: customer.email,
            customerName: customer.companyName
              || [customer.firstName, customer.lastName].filter(Boolean).join(" ")
              || "Client",
            vehicleDescription: vehicleDesc,
            garageName: garage.name,
            garagePhone: garage.phone ?? undefined,
            garageAddress: [garage.address, garage.postalCode, garage.city].filter(Boolean).join(", "),
          }).catch((err) => console.error("[closeRO] Erreur envoi email vehicule pret:", err));
        }
      }).catch((err) => console.error("[closeRO] Erreur recuperation donnees pour email:", err));

    revalidatePath(`/repair-orders/${roId}`);
    revalidatePath("/repair-orders");
    revalidatePath("/invoices");
    revalidatePath("/stock");
    return { success: true, repairOrderId: invoiceId, warning: invoiceWarning };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur lors de la cloture";
    return { success: false, error: msg };
  }
}
