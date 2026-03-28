"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Phone, Mail, MapPin, Car, Wrench, FileText, Euro, Plus, Zap, Loader2, MessageSquare, Copy } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { useAI } from "@/components/ai/ai-provider";
import { AddVehicleDialog } from "./add-vehicle-dialog";
import { toast } from "sonner";
import type { MessageType } from "@/lib/ai/prompts/message-draft-prompt";

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

const MESSAGE_TYPES: { value: MessageType; label: string }[] = [
  { value: "vehicle_ready", label: "Véhicule prêt" },
  { value: "maintenance_reminder", label: "Rappel entretien" },
  { value: "quote_followup", label: "Relance devis" },
];

export function CustomerDetail({ customer, stats }: Props) {
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [draftedMessage, setDraftedMessage] = useState<string | null>(null);
  const [showMessageUI, setShowMessageUI] = useState(false);
  const { isEnabled: aiEnabled } = useAI();

  async function handleDraftMessage(type: MessageType) {
    setDrafting(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}/draft-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setDraftedMessage(data.message);
      toast.success("Message rédigé");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur IA");
    } finally {
      setDrafting(false);
    }
  }

  function handleCopyMessage() {
    if (draftedMessage) {
      navigator.clipboard.writeText(draftedMessage);
      toast.success("Message copié dans le presse-papier");
    }
  }

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

      {/* Communication IA */}
      {aiEnabled && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Communication
            </CardTitle>
            {!showMessageUI && (
              <Button variant="outline" size="sm" onClick={() => setShowMessageUI(true)}>
                <Zap className="h-3 w-3" /> Rédiger un message
              </Button>
            )}
          </CardHeader>
          {showMessageUI && (
            <CardContent className="space-y-3">
              {!draftedMessage ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Choisissez le type de message :</p>
                  <div className="flex flex-wrap gap-2">
                    {MESSAGE_TYPES.map((mt) => (
                      <Button
                        key={mt.value}
                        variant="outline"
                        size="sm"
                        onClick={() => handleDraftMessage(mt.value)}
                        disabled={drafting}
                      >
                        {drafting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                        {mt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
                      <Zap className="h-3 w-3" /> Message généré par l&apos;IA
                    </div>
                    <p className="text-sm">{draftedMessage}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCopyMessage}>
                      <Copy className="h-3 w-3" /> Copier
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setDraftedMessage(null); setShowMessageUI(false); }}>
                      Fermer
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

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
