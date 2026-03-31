"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layouts/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Spinner } from "@/components/ui/spinner";
import { createRepairOrderAction, type RepairOrderActionState } from "@/server/actions/repair-orders";
import { toast } from "sonner";

const initialState: RepairOrderActionState = { success: false };

interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
}

export default function NewRepairOrderPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createRepairOrderAction, initialState);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<{ id: string; licensePlate: string | null; brand: string | null; model: string | null }[]>([]);

  useEffect(() => {
    if (state.success && state.repairOrderId) {
      toast.success("OR cree");
      router.push(`/repair-orders/${state.repairOrderId}`);
    }
    if (state.error) toast.error(state.error);
  }, [state, router]);

  async function handleSearch() {
    if (search.length < 2) return;
    const res = await fetch(`/api/customers/search?q=${encodeURIComponent(search)}`);
    if (res.ok) setCustomers(await res.json());
  }

  async function selectCustomer(c: Customer) {
    setSelectedCustomer(c);
    setCustomers([]);
    try {
      const res = await fetch(`/api/customers/${c.id}/vehicles`);
      if (res.ok) setVehicles(await res.json());
    } catch {
      setVehicles([]);
    }
  }

  const customerName = selectedCustomer
    ? selectedCustomer.companyName || `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
    : "";

  return (
    <div className="space-y-6">
      <PageHeader title="Nouvel ordre de reparation" />

      <Card>
        <CardContent className="space-y-4 pt-6">
          {!selectedCustomer ? (
            <div className="space-y-3">
              <label className="text-sm font-medium">Rechercher un client</label>
              <div className="flex gap-2">
                <SearchInput
                  placeholder="Nom, telephone, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                />
                <Button type="button" onClick={handleSearch}>Chercher</Button>
              </div>
              {customers.length > 0 && (
                <div className="space-y-1">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className="w-full rounded-[var(--radius)] border border-border p-3 text-left hover:bg-secondary/50"
                    >
                      {c.companyName || `${c.firstName} ${c.lastName}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="customerId" value={selectedCustomer.id} />

              <div className="flex items-center justify-between rounded-[var(--radius)] bg-secondary/50 p-3">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{customerName}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                  Changer
                </Button>
              </div>

              <div className="space-y-2">
                <label htmlFor="ro-vehicle" className="text-sm font-medium">Vehicule</label>
                {vehicles.length > 0 ? (
                  <select
                    id="ro-vehicle"
                    name="vehicleId"
                    required
                    className="flex h-12 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-base"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} — {v.licensePlate}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun vehicule enregistre pour ce client.{" "}
                    <a href={`/customers/${selectedCustomer.id}`} className="text-primary underline">
                      Ajouter un vehicule
                    </a>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="ro-mileage" className="text-sm font-medium">Kilometrage a l&apos;entree</label>
                <Input id="ro-mileage" name="mileageAtIntake" type="number" min="0" placeholder="Ex: 85000" />
              </div>

              <div className="space-y-2">
                <label htmlFor="ro-complaint" className="text-sm font-medium">Plainte client</label>
                <textarea
                  id="ro-complaint"
                  name="customerComplaint"
                  rows={3}
                  placeholder="Description du probleme signale par le client..."
                  className="flex w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Spinner className="h-4 w-4" /> : "Creer l'OR"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
