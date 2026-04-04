"use server";

import { registerSchema } from "@/server/validators/user";
import { registerGarageAndOwner } from "@/server/services/user.service";

export type RegisterState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const raw = Object.fromEntries(formData);
  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { success: false, fieldErrors };
  }

  try {
    await registerGarageAndOwner(parsed.data);

    // Envoi email de bienvenue (non bloquant)
    import("@/server/services/email.service").then(({ sendWelcomeEmail }) => {
      sendWelcomeEmail({
        to: parsed.data.email,
        firstName: parsed.data.firstName,
        garageName: parsed.data.garageName,
      }).catch((err) => console.error("[register] Erreur envoi email bienvenue:", err));
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("[register] Registration failed:", error);
    let message = "Une erreur est survenue lors de l'inscription";
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes("garages_siret_unique") || (msg.includes("unique") && msg.includes("siret"))) {
        message = "Un garage avec ce SIRET existe deja";
      } else if (msg.includes("users_email_garage_idx") || (msg.includes("unique") && msg.includes("email"))) {
        message = "Un utilisateur avec cet email existe deja";
      } else if (msg.includes("unique")) {
        message = "Un garage avec ce SIRET ou un utilisateur avec cet email existe deja";
      }
    }
    return { success: false, error: message };
  }
}
