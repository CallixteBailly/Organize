"use server";

import { auth } from "@/lib/auth";
import { updateGarageSchema } from "@/server/validators/garage";
import { updateGarage } from "@/server/services/garage.service";
import { revalidatePath } from "next/cache";

export type GarageActionState = {
  success: boolean;
  error?: string;
};

export async function updateGarageAction(
  _prevState: GarageActionState,
  formData: FormData,
): Promise<GarageActionState> {
  const session = await auth();
  if (!session?.user || !["owner", "manager"].includes(session.user.role)) {
    return { success: false, error: "Acces refuse" };
  }

  const raw = Object.fromEntries(formData);
  const parsed = updateGarageSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: "Donnees invalides" };
  }

  try {
    await updateGarage(session.user.garageId, parsed.data);
    revalidatePath("/settings/garage");
    return { success: true };
  } catch (error) {
    console.error("[garage] Update failed:", error);
    return { success: false, error: "Erreur lors de la mise a jour" };
  }
}
