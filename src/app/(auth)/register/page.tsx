"use client";

import { useActionState, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { registerAction, type RegisterState } from "@/server/actions/auth";

const initialState: RegisterState = { success: false };

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const [siretLoading, setSiretLoading] = useState(false);
  const [siretError, setSiretError] = useState<string | null>(null);
  const [siretClosed, setSiretClosed] = useState(false);
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
    setSiretClosed(false);
    try {
      const res = await fetch(`/api/siret?q=${siret}`);
      const data = await res.json();
      if (!res.ok) {
        setSiretError(data.error ?? "Erreur lors de la recherche");
        return;
      }
      if (data.isClosed) {
        setSiretClosed(true);
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
        <h1 className="text-center text-lg font-semibold tracking-tight text-card-foreground">Creer votre compte</h1>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-5" noValidate>
          {state.error && (
            <div role="alert" className="rounded-[var(--radius)] bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {state.error}
            </div>
          )}

          <fieldset className="space-y-3 border-0 p-0 m-0">
            <legend className="mb-1 text-sm font-semibold text-foreground">Informations du garage</legend>

            <div className="flex gap-2">
              <Input
                name="siret"
                label="SIRET"
                placeholder="14 chiffres"
                required
                maxLength={14}
                error={state.fieldErrors?.siret?.[0] ?? siretError ?? undefined}
              />
              <Button
                type="button"
                variant="outline"
                className="mt-6 h-11 shrink-0"
                disabled={siretLoading}
                onClick={lookupSiret}
              >
                {siretLoading ? <Spinner className="h-4 w-4" /> : "Rechercher"}
              </Button>
            </div>
            {siretClosed && (
              <div role="alert" className="rounded-[var(--radius)] bg-warning/10 p-3 text-sm font-medium text-warning">
                Cette entreprise est radiee ou fermee. Vous pouvez continuer l&apos;inscription si necessaire.
              </div>
            )}
            <Input
              name="garageName"
              label="Nom du garage"
              placeholder="Mon Garage Auto"
              required
              autoComplete="organization"
              error={state.fieldErrors?.garageName?.[0]}
            />
            <Input
              name="address"
              label="Adresse"
              placeholder="12 rue de la Republique"
              required
              autoComplete="street-address"
              error={state.fieldErrors?.address?.[0]}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                name="city"
                label="Ville"
                placeholder="Lyon"
                required
                autoComplete="address-level2"
                error={state.fieldErrors?.city?.[0]}
              />
              <Input
                name="postalCode"
                label="Code postal"
                placeholder="69001"
                required
                maxLength={5}
                autoComplete="postal-code"
                error={state.fieldErrors?.postalCode?.[0]}
              />
            </div>
          </fieldset>

          <div className="border-t border-border" role="separator" />

          <fieldset className="space-y-3 border-0 p-0 m-0">
            <legend className="mb-1 text-sm font-semibold text-foreground">Votre compte</legend>

            <div className="grid grid-cols-2 gap-3">
              <Input
                name="firstName"
                label="Prenom"
                placeholder="Jean"
                required
                autoComplete="given-name"
                error={state.fieldErrors?.firstName?.[0]}
              />
              <Input
                name="lastName"
                label="Nom"
                placeholder="Dupont"
                required
                autoComplete="family-name"
                error={state.fieldErrors?.lastName?.[0]}
              />
            </div>
            <Input
              name="email"
              type="email"
              label="Email"
              placeholder="jean@mongarage.fr"
              required
              autoComplete="email"
              error={state.fieldErrors?.email?.[0]}
            />
            <Input
              name="password"
              type="password"
              label="Mot de passe"
              placeholder="Min. 8 caracteres"
              required
              autoComplete="new-password"
              error={state.fieldErrors?.password?.[0]}
            />
            <Input
              name="confirmPassword"
              type="password"
              label="Confirmer le mot de passe"
              placeholder="Retapez le mot de passe"
              required
              autoComplete="new-password"
              error={state.fieldErrors?.confirmPassword?.[0]}
            />
          </fieldset>

          <Button type="submit" className="mt-2 w-full" disabled={isPending}>
            {isPending ? <Spinner className="h-4 w-4" /> : "Creer mon garage"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Deja un compte ?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
