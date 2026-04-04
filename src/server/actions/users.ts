"use server";

import crypto from "crypto";
import { auth } from "@/lib/auth";
import { createUserSchema, updateUserSchema } from "@/server/validators/user";
import { createUser, updateUser, deactivateUser } from "@/server/services/user.service";
import { sendInvitationEmail } from "@/server/services/email.service";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { garages, invitationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
    const user = await createUser(session.user.garageId, parsed.data);

    // Generer un token d'activation (valable 72h)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    await db.insert(invitationTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
    const activationUrl = `${baseUrl}/activate-account?token=${token}`;

    // Envoi email d'invitation avec lien d'activation (non bloquant)
    const [garage] = await db
      .select({ name: garages.name })
      .from(garages)
      .where(eq(garages.id, session.user.garageId))
      .limit(1);

    if (garage) {
      sendInvitationEmail({
        to: parsed.data.email,
        firstName: parsed.data.firstName,
        garageName: garage.name,
        role: parsed.data.role,
        invitedBy: session.user.name,
        activationUrl,
      }).catch((err) => console.error("[createUser] Erreur envoi email invitation:", err));
    }

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
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const session = await auth();
  if (!session?.user || !["owner", "manager"].includes(session.user.role)) {
    return { success: false, error: "Acces refuse" };
  }

  const userId = formData.get("userId") as string;
  if (!userId) return { success: false, error: "Utilisateur non specifie" };

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
