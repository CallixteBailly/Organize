"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Phone, Mail, MapPin, Car, Wrench, FileText, Euro, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { AddVehicleDialog } from "./add-vehicle-dialog";

interface Vehicle {
  id: string;
  licensePlate: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  engineType: string | null;
  mileage: number | null;
}

interface Customer {
  id: string;
  type: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  siret: string | null;
  vatNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  notes: string | null;
  vehicles: Vehicle[];
}

interface Stats {
  repairOrderCount: number;
  invoiceCount: number;
  totalSpent: number;
}

interface Props {
  customer: Customer;
  stats: Stats;
}

export function CustomerDetail({ customer, stats }: Props) {
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Interventions" value={String(stats.repairOrderCount)} icon={Wrench} />
        <StatCard title="Factures" value={String(stats.invoiceCount)} icon={FileText} />
        <StatCard title="CA total" value={formatCurrency(stats.totalSpent)} icon={Euro} />
      </div>

      {/* Coordonnees */}
      <Card>
        <CardHeader>
          <CardTitle>Coordonnees</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {customer.type === "company" && (
            <Badge variant="secondary">Entreprise</Badge>
          )}
          {customer.phone && (
            <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {customer.phone}
            </a>
          )}
          {customer.email && (
            <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {customer.email}
            </a>
          )}
          {(customer.address || customer.city) && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                {customer.address && <p>{customer.address}</p>}
                {(customer.postalCode || customer.city) && (
                  <p>
                    {customer.postalCode} {customer.city}
                  </p>
                )}
              </div>
            </div>
          )}
          {customer.siret && (
            <p className="text-sm text-muted-foreground">SIRET : {customer.siret}</p>
          )}
          {customer.notes && (
            <p className="text-sm text-muted-foreground italic">{customer.notes}</p>
          )}
        </CardContent>
      </Card>

      {/* Vehicules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Vehicules</CardTitle>
          <Button size="sm" onClick={() => setShowAddVehicle(true)}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          {customer.vehicles.length === 0 ? (
            <EmptyState
              icon={Car}
              title="Aucun vehicule"
              description="Ajoutez le premier vehicule de ce client"
              className="py-6"
            />
          ) : (
            <div className="space-y-3">
              {customer.vehicles.map((v) => (
                <Link key={v.id} href={`/vehicles/${v.id}`}>
                  <div className="flex items-center gap-4 rounded-[var(--radius)] border border-border p-3 transition-colors hover:bg-secondary/50">
                    <Car className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {v.brand} {v.model}
                        </p>
                        {v.year && (
                          <Badge variant="outline">{v.year}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {v.licensePlate && <span className="font-mono">{v.licensePlate}</span>}
                        {v.engineType && <span>{v.engineType}</span>}
                        {v.mileage && <span>{v.mileage.toLocaleString("fr-FR")} km</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showAddVehicle && (
        <AddVehicleDialog customerId={customer.id} onClose={() => setShowAddVehicle(false)} />
      )}
    </div>
  );
}
