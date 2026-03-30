"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { X } from "lucide-react";
import { createUserAction, type UserActionState } from "@/server/actions/users";
import { useDialog } from "@/lib/hooks/use-dialog";
import { toast } from "sonner";

const initialState: UserActionState = { success: false };

interface AddUserDialogProps {
  onClose: () => void;
}

export function AddUserDialog({ onClose }: AddUserDialogProps) {
  const dialogRef = useDialog(onClose);
  const [state, formAction, isPending] = useActionState(createUserAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Utilisateur cree");
      onClose();
    }
    if (state.error) toast.error(state.error);
  }, [state, onClose]);

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="add-user-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle id="add-user-title">Nouvel utilisateur</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input name="firstName" placeholder="Prenom" required aria-label="Prenom" />
              <Input name="lastName" placeholder="Nom" required aria-label="Nom" />
            </div>
            <Input name="email" type="email" placeholder="Email" required autoComplete="off" aria-label="Email" />
            <Input
              name="password"
              type="password"
              placeholder="Mot de passe"
              required
              autoComplete="new-password"
              aria-label="Mot de passe"
            />
            <Input name="phone" type="tel" placeholder="Telephone (optionnel)" aria-label="Telephone" />
            <div className="space-y-2">
              <label htmlFor="user-role" className="text-sm font-medium">Role</label>
              <select
                id="user-role"
                name="role"
                required
                className="flex h-12 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="mechanic">Mecanicien</option>
                <option value="secretary">Secretaire</option>
                <option value="manager">Gerant</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Spinner className="h-4 w-4" /> : "Creer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
