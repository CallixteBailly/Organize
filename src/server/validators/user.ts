import { z } from "zod/v4";

export const registerSchema = z
  .object({
    // Garage info
    garageName: z.string().min(2, "Le nom du garage est requis"),
    siret: z
      .string()
      .length(14, "Le SIRET doit contenir 14 chiffres")
      .regex(/^\d{14}$/, "Le SIRET ne doit contenir que des chiffres"),
    address: z.string().min(5, "L'adresse est requise"),
    city: z.string().min(2, "La ville est requise"),
    postalCode: z
      .string()
      .length(5, "Le code postal doit contenir 5 chiffres")
      .regex(/^\d{5}$/, "Code postal invalide"),
    // User info
    firstName: z.string().min(2, "Le prenom est requis"),
    lastName: z.string().min(2, "Le nom est requis"),
    email: z.email("Email invalide"),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const createUserSchema = z.object({
  firstName: z.string().min(2, "Le prenom est requis"),
  lastName: z.string().min(2, "Le nom est requis"),
  email: z.email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caracteres"),
  role: z.enum(["manager", "mechanic", "secretary"]),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.email("Email invalide").optional(),
  phone: z.string().optional(),
  role: z.enum(["manager", "mechanic", "secretary"]).optional(),
  isActive: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
