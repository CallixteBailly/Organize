"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { X } from "lucide-react";
import { createCustomerAction, type CustomerActionState } from "@/server/actions/customers";
import { toast } from "sonner";

const initialState: CustomerActionState = { success: false };

interface Props {
  onClose: () => void;
}

export function AddCustomerDialog({ onClose }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createCustomerAction, initialState);

  useEffect(() => {
    if (state.success && state.customerId) {
      toast.success("Client cree");
      onClose();
      router.push(`/customers/${state.customerId}`);
    }
    if (state.error) toast.error(state.error);
  }, [state, onClose, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Nouveau client</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                name="type"
                className="flex h-12 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="individual">Particulier</option>
                <option value="company">Entreprise</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input name="firstName" placeholder="Prenom" />
              <Input name="lastName" placeholder="Nom" />
            </div>
            <Input name="companyName" placeholder="Raison sociale (si entreprise)" />
            <Input name="phone" type="tel" placeholder="Telephone" />
            <Input name="email" type="email" placeholder="Email" />
            <Input name="address" placeholder="Adresse" />
            <div className="grid grid-cols-2 gap-3">
              <Input name="city" placeholder="Ville" />
              <Input name="postalCode" placeholder="Code postal" />
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
