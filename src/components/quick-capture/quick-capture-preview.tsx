"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Car, Wrench, Euro, CreditCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { confirmQuickCaptureAction } from "@/server/actions/quick-capture";
import { toast } from "sonner";
import type {
  QuickCapturePreview,
  CustomerMatch,
  VehicleMatch,
} from "@/server/validators/quick-capture";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Espèces",
  card: "Carte bancaire",
  bank_transfer: "Virement",
  check: "Chèque",
  online: "En ligne",
};

interface Props {
  preview: QuickCapturePreview;
  onBack: () => void;
  onSuccess: () => void;
}

export function QuickCapturePreview({ preview, onBack, onSuccess }: Props) {
  const router = useRouter();
  const { parsed, customerMatches, vehicleMatches, rawText } = preview;

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(
    customerMatches.length === 1 ? customerMatches[0].id : undefined,
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(
    vehicleMatches.length === 1 ? vehicleMatches[0].id : undefined,
  );
  const [description, setDescription] = useState(parsed.service.description);
  const [amount, setAmount] = useState(parsed.amount?.toString() ?? "");
  const [createInvoice, setCreateInvoice] = useState(
    !!(parsed.amount && parsed.payment?.isPaid),
  );
  const [loading, setLoading] = useState(false);

  const canCreateInvoice = !!(parsed.payment && parsed.amount);
  const lowConfidence = parsed.confidence < 0.4;

  function formatCustomer(c: CustomerMatch) {
    return c.companyName ?? [c.firstName, c.lastName].filter(Boolean).join(" ") ?? "Client";
  }

  async function handleConfirm() {
    setLoading(true);

    const amountNum = parseFloat(amount);

    const result = await confirmQuickCaptureAction({
      rawText,
      customer: selectedCustomerId
        ? { existingId: selectedCustomerId }
        : {
            firstName: parsed.customer.firstName ?? undefined,
            lastName: parsed.customer.lastName ?? undefined,
            companyName: parsed.customer.companyName ?? undefined,
          },
      vehicle: selectedVehicleId
        ? { existingId: selectedVehicleId }
        : {
            brand: parsed.vehicle.brand ?? undefined,
            model: parsed.vehicle.model ?? undefined,
            licensePlate: parsed.vehicle.licensePlate ?? undefined,
            year: parsed.vehicle.year ?? undefined,
          },
      service: {
        description,
        type: parsed.service.type,
      },
      amount: amount && !isNaN(amountNum) ? amountNum : undefined,
      mileage: parsed.mileage ?? undefined,
      payment:
        createInvoice && parsed.payment
          ? { method: parsed.payment.method }
          : undefined,
      createInvoice,
    });

    setLoading(false);

    if (!result.success || !result.result) {
      toast.error(result.error ?? "Erreur lors de la création");
      return;
    }

    toast.success(
      result.result.invoiceNumber
        ? `OR ${result.result.repairOrderNumber} + Facture ${result.result.invoiceNumber} créés`
        : `OR ${result.result.repairOrderNumber} créé`,
    );
    onSuccess();
    router.push(`/repair-orders/${result.result.repairOrderId}`);
  }

  return (
    <div className="flex flex-col gap-4">
      {lowConfidence && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Données incertaines — vérifiez avant de confirmer.</span>
        </div>
      )}

      {/* Client */}
      <Section icon={<User className="h-4 w-4" />} title="Client">
        {customerMatches.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Choisir un client existant :</p>
            <div className="flex flex-col gap-1">
              {customerMatches.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="customer"
                    value={c.id}
                    checked={selectedCustomerId === c.id}
                    onChange={() => setSelectedCustomerId(c.id)}
                    className="accent-primary"
                  />
                  <span className="text-sm">{formatCustomer(c)}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Existant</Badge>
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="customer"
                  value=""
                  checked={!selectedCustomerId}
                  onChange={() => setSelectedCustomerId(undefined)}
                  className="accent-primary"
                />
                <span className="text-sm">
                  {(parsed.customer.companyName ??
                    [parsed.customer.firstName, parsed.customer.lastName].filter(Boolean).join(" ")) ||
                    "Nouveau client"}
                </span>
                <Badge className="ml-auto text-xs">Nouveau</Badge>
              </label>
            </div>
          </div>
        ) : (
          <p className="text-sm">
            {(parsed.customer.companyName ??
              [parsed.customer.firstName, parsed.customer.lastName].filter(Boolean).join(" ")) || (
                <span className="text-muted-foreground italic">Non détecté</span>
              )}
            <Badge className="ml-2 text-xs">Nouveau</Badge>
          </p>
        )}
      </Section>

      {/* Véhicule */}
      <Section icon={<Car className="h-4 w-4" />} title="Véhicule">
        {vehicleMatches.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Choisir un véhicule existant :</p>
            <div className="flex flex-col gap-1">
              {vehicleMatches.map((v) => (
                <label
                  key={v.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="vehicle"
                    value={v.id}
                    checked={selectedVehicleId === v.id}
                    onChange={() => setSelectedVehicleId(v.id)}
                    className="accent-primary"
                  />
                  <span className="text-sm">
                    {[v.brand, v.model].filter(Boolean).join(" ")}
                    {v.licensePlate && ` — ${v.licensePlate}`}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs">Existant</Badge>
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="vehicle"
                  value=""
                  checked={!selectedVehicleId}
                  onChange={() => setSelectedVehicleId(undefined)}
                  className="accent-primary"
                />
                <span className="text-sm">
                  {[parsed.vehicle.brand, parsed.vehicle.model].filter(Boolean).join(" ") ||
                    "Nouveau véhicule"}
                  {parsed.vehicle.licensePlate && ` — ${parsed.vehicle.licensePlate}`}
                </span>
                <Badge className="ml-auto text-xs">Nouveau</Badge>
              </label>
            </div>
          </div>
        ) : (
          <p className="text-sm">
            {[parsed.vehicle.brand, parsed.vehicle.model].filter(Boolean).join(" ") || (
              <span className="text-muted-foreground italic">Non détecté</span>
            )}
            {parsed.vehicle.licensePlate && ` — ${parsed.vehicle.licensePlate}`}
            <Badge className="ml-2 text-xs">Nouveau</Badge>
          </p>
        )}
      </Section>

      {/* Prestation */}
      <Section icon={<Wrench className="h-4 w-4" />} title="Prestation">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Section>

      {/* Montant */}
      {(parsed.amount !== null || parsed.amount === null) && (
        <Section icon={<Euro className="h-4 w-4" />} title="Montant TTC">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-sm text-muted-foreground">€</span>
          </div>
        </Section>
      )}

      {/* Paiement */}
      {parsed.payment && (
        <Section icon={<CreditCard className="h-4 w-4" />} title="Paiement">
          <p className="text-sm">{PAYMENT_LABELS[parsed.payment.method] ?? parsed.payment.method}</p>
        </Section>
      )}

      {/* Créer facture */}
      {canCreateInvoice && (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
          <input
            type="checkbox"
            checked={createInvoice}
            onChange={(e) => setCreateInvoice(e.target.checked)}
            className="h-5 w-5 accent-primary"
          />
          <div>
            <p className="text-sm font-medium">Créer aussi la facture</p>
            <p className="text-xs text-muted-foreground">
              Finalise et enregistre le paiement automatiquement
            </p>
          </div>
        </label>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={loading}>
          <ArrowLeft className="h-4 w-4" />
          Modifier
        </Button>
        <Button onClick={handleConfirm} className="flex-1" disabled={loading || !description.trim()}>
          {loading ? "Création..." : "Confirmer"}
        </Button>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
