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
    return { success: true };
  } catch (error: unknown) {
    console.error("[register] Registration failed:", error);
    const message =
      error instanceof Error && error.message.includes("unique")
        ? "Un garage avec ce SIRET ou un utilisateur avec cet email existe deja"
        : "Une erreur est survenue lors de l'inscription";
    return { success: false, error: message };
  }
}
