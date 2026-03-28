"use server";

import { auth } from "@/lib/auth";
import { createUserSchema, updateUserSchema } from "@/server/validators/user";
import { createUser, updateUser, deactivateUser } from "@/server/services/user.service";
import { revalidatePath } from "next/cache";

export type UserActionState = {
  success: boolean;
  error?: string;
};

export async function createUserAction(
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const session = await auth();
  if (!session?.user || !["owner", "manager"].includes(session.user.role)) {
    return { success: false, error: "Acces refuse" };
  }

  const raw = Object.fromEntries(formData);
  const parsed = createUserSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: "Donnees invalides" };
  }

  try {
    await createUser(session.user.garageId, parsed.data);
    revalidatePath("/settings/users");
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error && error.message.includes("unique")
        ? "Un utilisateur avec cet email existe deja"
        : "Erreur lors de la creation";
    return { success: false, error: message };
  }
}

export async function updateUserAction(
  userId: string,
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const session = await auth();
  if (!session?.user || !["owner", "manager"].includes(session.user.role)) {
    return { success: false, error: "Acces refuse" };
  }

  const raw = Object.fromEntries(formData);
  const parsed = updateUserSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: "Donnees invalides" };
  }

  try {
    await updateUser(session.user.garageId, userId, parsed.data);
    revalidatePath("/settings/users");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise a jour" };
  }
}

export async function deactivateUserAction(userId: string): Promise<UserActionState> {
  const session = await auth();
  if (!session?.user || !["owner", "manager"].includes(session.user.role)) {
    return { success: false, error: "Acces refuse" };
  }

  if (session.user.id === userId) {
    return { success: false, error: "Vous ne pouvez pas desactiver votre propre compte" };
  }

  try {
    await deactivateUser(session.user.garageId, userId);
    revalidatePath("/settings/users");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la desactivation" };
  }
}
