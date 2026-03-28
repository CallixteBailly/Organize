"use server";

import { auth } from "@/lib/auth";
import { createVehicleSchema, updateVehicleSchema } from "@/server/validators/vehicle";
import { createVehicle, updateVehicle } from "@/server/services/vehicle.service";
import { revalidatePath } from "next/cache";

export type VehicleActionState = {
  success: boolean;
  error?: string;
  vehicleId?: string;
};

export async function createVehicleAction(
  _prevState: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const raw = Object.fromEntries(formData);
  const parsed = createVehicleSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  try {
    const vehicle = await createVehicle(session.user.garageId, parsed.data);
    revalidatePath(`/customers/${parsed.data.customerId}`);
    return { success: true, vehicleId: vehicle.id };
  } catch {
    return { success: false, error: "Erreur lors de la creation du vehicule" };
  }
}

export async function updateVehicleAction(
  _prevState: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const vehicleId = formData.get("vehicleId") as string;
  if (!vehicleId) return { success: false, error: "Vehicule non specifie" };

  const raw = Object.fromEntries(formData);
  const parsed = updateVehicleSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: "Donnees invalides" };
  }

  try {
    await updateVehicle(session.user.garageId, vehicleId, parsed.data);
    revalidatePath(`/vehicles/${vehicleId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise a jour" };
  }
}
