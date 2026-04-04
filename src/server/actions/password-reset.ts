"use server";

import crypto from "crypto";
import { eq, and, isNull, gt } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { sendPasswordResetEmail } from "@/server/services/email.service";

export type ForgotPasswordState = {
  success: boolean;
  error?: string;
};

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { success: false, error: "Veuillez saisir votre adresse email" };
  }

  // Always show success to avoid email enumeration
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.isActive, true)))
      .limit(1);

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      await sendPasswordResetEmail({
        to: user.email,
        firstName: user.firstName,
        resetUrl,
      });
    }
  } catch (error) {
    console.error("[forgot-password] Error:", error);
    // Ne pas exposer l'erreur au client
  }

  return { success: true };
}

export type ResetPasswordState = {
  success: boolean;
  error?: string;
};

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) {
    return { success: false, error: "Token manquant" };
  }

  if (!password || password.length < 8) {
    return { success: false, error: "Le mot de passe doit contenir au moins 8 caracteres" };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Les mots de passe ne correspondent pas" };
  }

  try {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!resetToken) {
      return { success: false, error: "Lien invalide ou expire. Veuillez refaire une demande." };
    }

    const passwordHash = await bcryptjs.hash(password, 12);

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, resetToken.userId));

    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id));

    return { success: true };
  } catch (error) {
    console.error("[reset-password] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}
