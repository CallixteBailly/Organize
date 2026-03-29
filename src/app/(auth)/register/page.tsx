"use client";

import { useActionState, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { registerAction, type RegisterState } from "@/server/actions/auth";

const initialState: RegisterState = { success: false };

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const [siretLoading, setSiretLoading] = useState(false);
  const [siretError, setSiretError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const lookupSiret = useCallback(async () => {
    const form = formRef.current;
    if (!form) return;
    const siret = new FormData(form).get("siret") as string;
    if (!siret || siret.length !== 14) {
      setSiretError("Saisissez les 14 chiffres du SIRET");
      return;
    }

    setSiretLoading(true);
    setSiretError(null);
    try {
      const res = await fetch(`/api/siret?q=${siret}`);
      const data = await res.json();
      if (!res.ok) {
        setSiretError(data.error ?? "Erreur lors de la recherche");
        return;
      }
      // Auto-fill form fields
      const fields: Record<string, string> = {
        garageName: data.name,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        firstName: data.dirigeantFirstName,
        lastName: data.dirigeantLastName,
      };
      for (const [name, value] of Object.entries(fields)) {
        const input = form.elements.namedItem(name) as HTMLInputElement | null;
        if (input && value) {
          // Trigger React-compatible value change
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    } catch {
      setSiretError("Impossible de contacter le service");
    } finally {
      setSiretLoading(false);
    }
  }, []);

  useEffect(() => {
    if (state.success) {
      router.push("/login?registered=true");
    }
  }, [state.success, router]);

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Creer votre compte</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-[var(--radius)] bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <p className="text-sm font-medium text-muted-foreground">Informations du garage</p>

          <div className="flex gap-2">
            <Input
              name="siret"
              placeholder="SIRET (14 chiffres)"
              required
              maxLength={14}
              error={state.fieldErrors?.siret?.[0] ?? siretError ?? undefined}
            />
            <Button
              type="button"
              variant="outline"
              className="h-12 shrink-0"
              disabled={siretLoading}
              onClick={lookupSiret}
            >
              {siretLoading ? <Spinner className="h-4 w-4" /> : "Rechercher"}
            </Button>
          </div>
          <Input
            name="garageName"
            placeholder="Nom du garage"
            required
            error={state.fieldErrors?.garageName?.[0]}
          />
          <Input
            name="address"
            placeholder="Adresse"
            required
            error={state.fieldErrors?.address?.[0]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="city"
              placeholder="Ville"
              required
              error={state.fieldErrors?.city?.[0]}
            />
            <Input
              name="postalCode"
              placeholder="Code postal"
              required
              maxLength={5}
              error={state.fieldErrors?.postalCode?.[0]}
            />
          </div>

          <p className="pt-2 text-sm font-medium text-muted-foreground">Votre compte</p>

          <div className="grid grid-cols-2 gap-3">
            <Input
              name="firstName"
              placeholder="Prenom"
              required
              error={state.fieldErrors?.firstName?.[0]}
            />
            <Input
              name="lastName"
              placeholder="Nom"
              required
              error={state.fieldErrors?.lastName?.[0]}
            />
          </div>
          <Input
            name="email"
            type="email"
            placeholder="Email"
            required
            autoComplete="email"
            error={state.fieldErrors?.email?.[0]}
          />
          <Input
            name="password"
            type="password"
            placeholder="Mot de passe (min. 8 caracteres)"
            required
            autoComplete="new-password"
            error={state.fieldErrors?.password?.[0]}
          />
          <Input
            name="confirmPassword"
            type="password"
            placeholder="Confirmer le mot de passe"
            required
            autoComplete="new-password"
            error={state.fieldErrors?.confirmPassword?.[0]}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Spinner className="h-4 w-4" /> : "Creer mon garage"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Deja un compte ?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
