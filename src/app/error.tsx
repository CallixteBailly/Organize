"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <AlertTriangle className="h-16 w-16 text-destructive" />
      <h1 className="text-2xl font-bold text-foreground">Une erreur est survenue</h1>
      <p className="text-muted-foreground">
        {error.message || "Quelque chose s'est mal passe. Veuillez reessayer."}
      </p>
      <Button onClick={reset}>Reessayer</Button>
    </div>
  );
}
