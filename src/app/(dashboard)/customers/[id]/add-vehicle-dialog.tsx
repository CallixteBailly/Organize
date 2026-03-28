"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { X } from "lucide-react";
import { createVehicleAction, type VehicleActionState } from "@/server/actions/vehicles";
import { toast } from "sonner";

const initialState: VehicleActionState = { success: false };

interface Props {
  customerId: string;
  onClose: () => void;
}

export function AddVehicleDialog({ customerId, onClose }: Props) {
  const [state, formAction, isPending] = useActionState(createVehicleAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Vehicule ajoute");
      onClose();
    }
    if (state.error) toast.error(state.error);
  }, [state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Nouveau vehicule</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="customerId" value={customerId} />
            <Input name="licensePlate" placeholder="Immatriculation (ex: AB-123-CD)" required />
            <div className="grid grid-cols-2 gap-3">
              <Input name="brand" placeholder="Marque" required />
              <Input name="model" placeholder="Modele" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input name="year" type="number" placeholder="Annee" min={1900} max={2100} />
              <div className="space-y-2">
                <select
                  name="engineType"
                  className="flex h-12 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Motorisation</option>
                  <option value="diesel">Diesel</option>
                  <option value="essence">Essence</option>
                  <option value="electrique">Electrique</option>
                  <option value="hybride">Hybride</option>
                  <option value="gpl">GPL</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input name="mileage" type="number" placeholder="Kilometrage" min={0} />
              <Input name="color" placeholder="Couleur" />
            </div>
            <Input name="vin" placeholder="VIN (optionnel)" maxLength={17} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Spinner className="h-4 w-4" /> : "Ajouter"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
