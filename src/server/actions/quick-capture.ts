"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/server/services/activity-log.service";
import { quickCaptureConfirmSchema } from "@/server/validators/quick-capture";
import { confirmQuickCapture } from "@/server/services/quick-capture.service";
import { notifyCustomerCreatedByAI } from "@/server/services/notification.service";
import type { QuickCaptureConfirmInput, QuickCaptureResult } from "@/server/validators/quick-capture";

export interface ConfirmActionState {
  success: boolean;
  result?: QuickCaptureResult;
  error?: string;
}

export async function confirmQuickCaptureAction(
  data: QuickCaptureConfirmInput,
): Promise<ConfirmActionState> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Non authentifié" };
  }

  const parsed = quickCaptureConfirmSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  try {
    const result = await confirmQuickCapture(
      session.user.garageId,
      session.user.id,
      parsed.data,
    );

    await logActivity({
      garageId: session.user.garageId,
      userId: session.user.id,
      source: "ai",
      action: "create",
      entityType: "repair_order",
      entityId: result.repairOrderId,
      description: `Saisie rapide IA confirmee par ${session.user.name}`,
      metadata: {
        customerId: result.customerId,
        vehicleId: result.vehicleId,
        invoiceId: result.invoiceId,
      },
    });
    if (!parsed.data.customer.existingId) {
      notifyCustomerCreatedByAI(
        session.user.garageId,
        {
          id: result.customerId,
          firstName: parsed.data.customer.firstName ?? "",
          lastName: parsed.data.customer.lastName ?? "",
          companyName: parsed.data.customer.companyName,
        },
        session.user.id,
      ).catch((err) => console.error("[quick-capture] Erreur notification:", err));
    }

    revalidatePath("/repair-orders");
    revalidatePath("/customers");
    if (result.invoiceId) {
      revalidatePath("/invoices");
    }

    return { success: true, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return { success: false, error: message };
  }
}
