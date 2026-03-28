"use server";

import { auth } from "@/lib/auth";
import { createCustomerSchema, updateCustomerSchema } from "@/server/validators/customer";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/server/services/customer.service";
import { revalidatePath } from "next/cache";

export type CustomerActionState = {
  success: boolean;
  error?: string;
  customerId?: string;
};

export async function createCustomerAction(
  _prevState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const raw = Object.fromEntries(formData);
  const parsed = createCustomerSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  try {
    const customer = await createCustomer(session.user.garageId, parsed.data);
    revalidatePath("/customers");
    return { success: true, customerId: customer.id };
  } catch {
    return { success: false, error: "Erreur lors de la creation du client" };
  }
}

export async function updateCustomerAction(
  customerId: string,
  _prevState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const raw = Object.fromEntries(formData);
  const parsed = updateCustomerSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: "Donnees invalides" };
  }

  try {
    await updateCustomer(session.user.garageId, customerId, parsed.data);
    revalidatePath(`/customers/${customerId}`);
    revalidatePath("/customers");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise a jour" };
  }
}

export async function deleteCustomerAction(customerId: string): Promise<CustomerActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  try {
    await deleteCustomer(session.user.garageId, customerId);
    revalidatePath("/customers");
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Impossible de supprimer ce client (il a peut-etre des documents associes)",
    };
  }
}
