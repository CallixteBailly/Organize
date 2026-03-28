import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
      <h1 className="text-2xl font-bold text-foreground">Page introuvable</h1>
      <p className="text-muted-foreground">
        La page que vous cherchez n&apos;existe pas ou a ete deplacee.
      </p>
      <Link href="/">
        <Button>Retour au dashboard</Button>
      </Link>
    </div>
  );
}
