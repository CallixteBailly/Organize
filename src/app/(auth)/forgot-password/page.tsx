"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { forgotPasswordAction, type ForgotPasswordState } from "@/server/actions/password-reset";

const initialState: ForgotPasswordState = { success: false };

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);

  if (state.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Email envoye</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Si un compte existe avec cette adresse, vous recevrez un lien de reinitialisation
            par email.
          </p>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              Retour a la connexion
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Mot de passe oublie</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          <p className="text-sm text-muted-foreground">
            Saisissez votre adresse email et nous vous enverrons un lien pour reinitialiser votre
            mot de passe.
          </p>
          {state.error && (
            <div
              role="alert"
              className="rounded-[var(--radius)] bg-destructive/10 p-3 text-sm font-medium text-destructive"
            >
              {state.error}
            </div>
          )}
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="garage@exemple.fr"
            required
            autoComplete="email"
          />
          <Button type="submit" className="mt-2 w-full" disabled={isPending}>
            {isPending ? <Spinner className="h-4 w-4" /> : "Envoyer le lien"}
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
