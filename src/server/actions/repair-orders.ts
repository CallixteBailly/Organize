"use server";

import { auth } from "@/lib/auth";
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
import { revalidatePath } from "next/cache";

export type RepairOrderActionState = {
  success: boolean;
  error?: string;
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
    revalidatePath(`/repair-orders/${roId}`);
    revalidatePath("/repair-orders");
    revalidatePath("/stock");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur lors de la cloture";
    return { success: false, error: msg };
  }
}
