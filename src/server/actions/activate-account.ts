"use server";

import { eq, and, isNull, gt } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { db } from "@/lib/db";
import { users, invitationTokens } from "@/lib/db/schema";

export type ActivateAccountState = {
  success: boolean;
  error?: string;
  userName?: string;
};

export async function getInvitationInfo(token: string): Promise<{
  valid: boolean;
  firstName?: string;
  email?: string;
}> {
  if (!token) return { valid: false };

  const [invitation] = await db
    .select({
      firstName: users.firstName,
      email: users.email,
      usedAt: invitationTokens.usedAt,
      expiresAt: invitationTokens.expiresAt,
    })
    .from(invitationTokens)
    .innerJoin(users, eq(invitationTokens.userId, users.id))
    .where(
      and(
        eq(invitationTokens.token, token),
        isNull(invitationTokens.usedAt),
        gt(invitationTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!invitation) return { valid: false };

  return {
    valid: true,
    firstName: invitation.firstName,
    email: invitation.email,
  };
}

export async function activateAccountAction(
  _prevState: ActivateAccountState,
  formData: FormData,
): Promise<ActivateAccountState> {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) {
    return { success: false, error: "Lien d'activation invalide" };
  }

  if (!password || password.length < 8) {
    return { success: false, error: "Le mot de passe doit contenir au moins 8 caracteres" };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Les mots de passe ne correspondent pas" };
  }

  try {
    const [invitation] = await db
      .select()
      .from(invitationTokens)
      .where(
        and(
          eq(invitationTokens.token, token),
          isNull(invitationTokens.usedAt),
          gt(invitationTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!invitation) {
      return { success: false, error: "Lien invalide ou expire. Contactez votre responsable." };
    }

    const passwordHash = await bcryptjs.hash(password, 12);

    // Activer le compte avec le nouveau mot de passe
    await db
      .update(users)
      .set({ passwordHash, isActive: true, updatedAt: new Date() })
      .where(eq(users.id, invitation.userId));

    // Marquer le token comme utilise
    await db
      .update(invitationTokens)
      .set({ usedAt: new Date() })
      .where(eq(invitationTokens.id, invitation.id));

    // Recuperer le nom pour le message de succes
    const [user] = await db
      .select({ firstName: users.firstName })
      .from(users)
      .where(eq(users.id, invitation.userId))
      .limit(1);

    return { success: true, userName: user?.firstName };
  } catch (error) {
    console.error("[activate-account] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}
