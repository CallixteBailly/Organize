"use client";

import { Suspense, useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  activateAccountAction,
  getInvitationInfo,
  type ActivateAccountState,
} from "@/server/actions/activate-account";

const initialState: ActivateAccountState = { success: false };

export default function ActivateAccountPage() {
  return (
    <Suspense fallback={<Spinner className="mx-auto h-8 w-8" />}>
      <ActivateAccountForm />
    </Suspense>
  );
}

function ActivateAccountForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, formAction, isPending] = useActionState(activateAccountAction, initialState);
  const [info, setInfo] = useState<{ valid: boolean; firstName?: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getInvitationInfo(token).then(setInfo).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    return <Spinner className="mx-auto h-8 w-8" />;
  }

  if (state.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Compte active !</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Bienvenue {state.userName} ! Votre compte est maintenant actif. Vous pouvez vous connecter.
          </p>
          <Link href="/login" className="block">
            <Button className="w-full">Se connecter</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!token || (info && !info.valid)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Lien invalide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Ce lien d&apos;activation est invalide ou a expire. Contactez votre responsable pour
            recevoir une nouvelle invitation.
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
        <CardTitle className="text-center">Activez votre compte</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="token" value={token} />
          {info?.firstName && (
            <p className="text-sm text-muted-foreground">
              Bonjour <strong>{info.firstName}</strong>, choisissez votre mot de passe pour
              acceder a Organize.
            </p>
          )}
          {info?.email && (
            <p className="text-sm text-muted-foreground">
              Email : <strong>{info.email}</strong>
            </p>
          )}
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
            label="Mot de passe"
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
            {isPending ? <Spinner className="h-4 w-4" /> : "Activer mon compte"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
