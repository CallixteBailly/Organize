"use server";

import { auth } from "@/lib/auth";
import { catalogLineSchema } from "@/server/validators/catalog";
import { addRepairOrderLine } from "@/server/services/repair-order.service";
import { revalidatePath } from "next/cache";
import type { RepairOrderActionState } from "@/server/actions/repair-orders";

export async function addCatalogPartToRepairOrderAction(
  _prevState: RepairOrderActionState,
  formData: FormData,
): Promise<RepairOrderActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const raw = Object.fromEntries(formData);
  const parsed = catalogLineSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const { repairOrderId, description, reference, brand, unitPrice, quantity, vatRate } =
    parsed.data;

  const fullDescription = [brand, reference, description].filter(Boolean).join(" — ");

  try {
    await addRepairOrderLine(session.user.garageId, {
      repairOrderId,
      type: "part",
      description: fullDescription,
      reference,
      quantity,
      unitPrice,
      vatRate,
      discountPercent: 0,
    });
    revalidatePath(`/repair-orders/${repairOrderId}`);
    return { success: true, repairOrderId };
  } catch (error) {
    console.error("[catalog] Add part to RO failed:", error);
    return { success: false, error: "Erreur lors de l'ajout de la pièce à l'OR" };
  }
}
