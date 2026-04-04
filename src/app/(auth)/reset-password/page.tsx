"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { resetPasswordAction, type ResetPasswordState } from "@/server/actions/password-reset";

const initialState: ResetPasswordState = { success: false };

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);

  if (state.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Mot de passe modifie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Votre mot de passe a ete reinitialise avec succes. Vous pouvez maintenant vous
            connecter.
          </p>
          <Link href="/login" className="block">
            <Button className="w-full">Se connecter</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Lien invalide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Le lien de reinitialisation est invalide ou a expire.
          </p>
          <Link href="/forgot-password" className="block">
            <Button variant="outline" className="w-full">
              Refaire une demande
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Nouveau mot de passe</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="token" value={token} />
          {state.error && (
            <div
              role="alert"
              className="rounded-[var(--radius)] bg-destructive/10 p-3 text-sm font-medium text-destructive"
            >
              {state.error}
            </div>
          )}
          <Input
            id="password"
            name="password"
            type="password"
            label="Nouveau mot de passe"
            placeholder="8 caracteres minimum"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirmer le mot de passe"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Button type="submit" className="mt-2 w-full" disabled={isPending}>
            {isPending ? <Spinner className="h-4 w-4" /> : "Reinitialiser le mot de passe"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Retour a la connexion
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
