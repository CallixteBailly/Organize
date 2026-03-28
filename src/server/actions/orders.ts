"use server";

import { auth } from "@/lib/auth";
import {
  createSupplierSchema,
  updateSupplierSchema,
  quickOrderSchema,
} from "@/server/validators/order";
import { createSupplier, updateSupplier, deactivateSupplier } from "@/server/services/supplier.service";
import { quickOrder, updateOrderStatus } from "@/server/services/order.service";
import { revalidatePath } from "next/cache";

export type OrderActionState = {
  success: boolean;
  error?: string;
  orderId?: string;
};

export type SupplierActionState = {
  success: boolean;
  error?: string;
};

export async function createSupplierAction(
  _prevState: SupplierActionState,
  formData: FormData,
): Promise<SupplierActionState> {
  const session = await auth();
  if (!session?.user || !["owner", "manager"].includes(session.user.role)) {
    return { success: false, error: "Acces refuse" };
  }

  const raw = Object.fromEntries(formData);
  const parsed = createSupplierSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  try {
    await createSupplier(session.user.garageId, parsed.data);
    revalidatePath("/orders");
    revalidatePath("/settings/suppliers");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la creation du fournisseur" };
  }
}

export async function updateSupplierAction(
  _prevState: SupplierActionState,
  formData: FormData,
): Promise<SupplierActionState> {
  const session = await auth();
  if (!session?.user || !["owner", "manager"].includes(session.user.role)) {
    return { success: false, error: "Acces refuse" };
  }

  const supplierId = formData.get("supplierId") as string;
  if (!supplierId) return { success: false, error: "Fournisseur non specifie" };

  const raw = Object.fromEntries(formData);
  const parsed = updateSupplierSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: "Donnees invalides" };
  }

  try {
    await updateSupplier(session.user.garageId, supplierId, parsed.data);
    revalidatePath("/orders");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise a jour" };
  }
}

export async function deactivateSupplierAction(supplierId: string): Promise<SupplierActionState> {
  const session = await auth();
  if (!session?.user || !["owner", "manager"].includes(session.user.role)) {
    return { success: false, error: "Acces refuse" };
  }

  try {
    await deactivateSupplier(session.user.garageId, supplierId);
    revalidatePath("/orders");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la desactivation" };
  }
}

export async function quickOrderAction(
  _prevState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const raw = Object.fromEntries(formData);
  const parsed = quickOrderSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  try {
    const order = await quickOrder(session.user.garageId, session.user.id, parsed.data);
    revalidatePath("/orders");
    return { success: true, orderId: order.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur lors de la commande";
    return { success: false, error: msg };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: "confirmed" | "shipped" | "delivered" | "cancelled",
): Promise<OrderActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  try {
    await updateOrderStatus(session.user.garageId, orderId, status);
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise a jour du statut" };
  }
}
