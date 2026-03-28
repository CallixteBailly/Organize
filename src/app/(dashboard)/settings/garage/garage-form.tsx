"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { updateGarageAction, type GarageActionState } from "@/server/actions/garage";
import { toast } from "sonner";
import { useEffect } from "react";

interface GarageFormProps {
  garage: {
    name: string;
    siret: string;
    vatNumber: string | null;
    address: string;
    city: string;
    postalCode: string;
    phone: string | null;
    email: string | null;
    website: string | null;
    invoicePrefix: string;
    quotePrefix: string;
    repairOrderPrefix: string;
  };
}

const initialState: GarageActionState = { success: false };

export function GarageSettingsForm({ garage }: GarageFormProps) {
  const [state, formAction, isPending] = useActionState(updateGarageAction, initialState);

  useEffect(() => {
    if (state.success) toast.success("Garage mis a jour");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom du garage</label>
              <Input name="name" defaultValue={garage.name} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">SIRET</label>
              <Input name="siret" defaultValue={garage.siret} required maxLength={14} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">N° TVA</label>
              <Input name="vatNumber" defaultValue={garage.vatNumber ?? ""} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telephone</label>
              <Input name="phone" defaultValue={garage.phone ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Adresse</label>
              <Input name="address" defaultValue={garage.address} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ville</label>
              <Input name="city" defaultValue={garage.city} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Code postal</label>
              <Input name="postalCode" defaultValue={garage.postalCode} required maxLength={5} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input name="email" type="email" defaultValue={garage.email ?? ""} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Site web</label>
              <Input name="website" defaultValue={garage.website ?? ""} />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Prefixes documents</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Factures</label>
                <Input name="invoicePrefix" defaultValue={garage.invoicePrefix} maxLength={10} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Devis</label>
                <Input name="quotePrefix" defaultValue={garage.quotePrefix} maxLength={10} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">OR</label>
                <Input
                  name="repairOrderPrefix"
                  defaultValue={garage.repairOrderPrefix}
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner className="h-4 w-4" /> : "Enregistrer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
