"use client";

import { useActionState, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Lock, CreditCard, Plus, Trash2, List, Hash } from "lucide-react";
import {
  finalizeInvoiceAction,
  addInvoiceLineAction,
  removeInvoiceLineAction,
  recordPaymentAction,
  type InvoiceActionState,
} from "@/server/actions/invoices";
import { toast } from "sonner";
import type { UserRole } from "@/lib/constants/roles";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  finalized: { label: "Finalisee", variant: "default" },
  sent: { label: "Envoyee", variant: "default" },
  paid: { label: "Payee", variant: "success" },
  partially_paid: { label: "Partiel", variant: "warning" },
  overdue: { label: "En retard", variant: "destructive" },
  cancelled: { label: "Annulee", variant: "destructive" },
};

interface InvoiceLine {
  id: string;
  type: string;
  description: string;
  reference: string | null;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  totalHt: string;
  totalVat: string;
}

interface Payment {
  id: string;
  amount: string;
  method: string;
  reference: string | null;
  paidAt: Date;
}

interface Props {
  data: {
    invoice: {
      id: string;
      invoiceNumber: string;
      status: string;
      customerName: string;
      customerAddress: string;
      totalHt: string;
      totalVat: string;
      totalTtc: string;
      amountPaid: string;
      issueDate: Date;
      dueDate: Date;
      nf525Hash: string | null;
      nf525Sequence: number | null;
      notes: string | null;
    };
    lines: InvoiceLine[];
    payments: Payment[];
  };
  userRole: UserRole;
}

const addLineInitial: InvoiceActionState = { success: false };
const paymentInitial: InvoiceActionState = { success: false };

const methodLabels: Record<string, string> = {
  cash: "Especes",
  card: "Carte",
  bank_transfer: "Virement",
  check: "Cheque",
  online: "En ligne",
};

export function InvoiceDetail({ data, userRole }: Props) {
  const { invoice: inv, lines, payments: paymentsList } = data;
  const status = statusConfig[inv.status] ?? statusConfig.draft;
  const isDraft = inv.status === "draft";
  const canFinalize = isDraft && ["owner", "manager"].includes(userRole);
  const remaining = Number(inv.totalTtc) - Number(inv.amountPaid);
  const canPay = ["finalized", "sent", "partially_paid", "overdue"].includes(inv.status) && remaining > 0;

  const [finalizing, setFinalizing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [addLineState, addLineFormAction, addLinePending] = useActionState(addInvoiceLineAction, addLineInitial);
  const [paymentState, paymentFormAction, paymentPending] = useActionState(recordPaymentAction, paymentInitial);

  useEffect(() => {
    if (addLineState.success) toast.success("Ligne ajoutee");
    if (addLineState.error) toast.error(addLineState.error);
  }, [addLineState]);

  useEffect(() => {
    if (paymentState.success) { toast.success("Paiement enregistre"); setShowPayment(false); }
    if (paymentState.error) toast.error(paymentState.error);
  }, [paymentState]);

  async function handleFinalize() {
    setFinalizing(true);
    const result = await finalizeInvoiceAction(inv.id);
    setFinalizing(false);
    if (result.success) toast.success("Facture finalisee — hash NF525 genere");
    else toast.error(result.error ?? "Erreur");
  }

  async function handleRemoveLine(lineId: string) {
    const result = await removeInvoiceLineAction(lineId, inv.id);
    if (result.success) toast.success("Ligne supprimee");
    else toast.error(result.error ?? "Erreur");
  }

  return (
    <div className="space-y-6">
      {/* Totaux */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total HT</p>
            <p className="text-lg font-bold">{formatCurrency(inv.totalHt)}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">TVA</p>
            <p className="text-lg font-bold">{formatCurrency(inv.totalVat)}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total TTC</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(inv.totalTtc)}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Reste du</p>
            <p className={`text-lg font-bold ${remaining > 0 ? "text-destructive" : "text-success"}`}>
              {formatCurrency(remaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info + Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={status.variant}>{status.label}</Badge>
        <span className="text-sm text-muted-foreground">Emise le {formatDate(inv.issueDate)}</span>
        <span className="text-sm text-muted-foreground">Echeance {formatDate(inv.dueDate)}</span>
        {inv.nf525Hash && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
            <Hash className="h-3 w-3" />
            NF525 #{inv.nf525Sequence}
          </span>
        )}
        <div className="flex-1" />
        {canFinalize && (
          <Button onClick={handleFinalize} disabled={finalizing}>
            {finalizing ? <Spinner className="h-4 w-4" /> : <><Lock className="h-4 w-4" /> Finaliser (NF525)</>}
          </Button>
        )}
        {canPay && (
          <Button variant="outline" onClick={() => setShowPayment(true)}>
            <CreditCard className="h-4 w-4" /> Enregistrer paiement
          </Button>
        )}
      </div>

      {/* Client */}
      <Card>
        <CardContent className="pt-4 text-sm">
          <p className="font-medium">{inv.customerName}</p>
          <p className="text-muted-foreground">{inv.customerAddress}</p>
          {inv.notes && <p className="mt-2 italic text-muted-foreground">{inv.notes}</p>}
        </CardContent>
      </Card>

      {/* Lignes */}
      <Card>
        <CardHeader><CardTitle>Lignes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {lines.length === 0 ? (
            <EmptyState icon={List} title="Aucune ligne" className="py-4" />
          ) : (
            <div className="space-y-2">
              {lines.map((line) => (
                <div key={line.id} className="flex items-center gap-3 rounded-[var(--radius)] border border-border p-3">
                  <Badge variant={line.type === "part" ? "secondary" : "default"}>
                    {line.type === "part" ? "Piece" : line.type === "labor" ? "MO" : "Autre"}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{line.description}</p>
                  </div>
                  <div className="text-right text-sm shrink-0">
                    <p>{line.quantity} x {formatCurrency(line.unitPrice)}</p>
                    <p className="font-bold">{formatCurrency(line.totalHt)} HT</p>
                  </div>
                  {isDraft && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveLine(line.id)} aria-label={`Supprimer ${line.description}`}>
                      <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {isDraft && (
            <form action={addLineFormAction} className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> Ajouter</p>
              <input type="hidden" name="invoiceId" value={inv.id} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <select name="type" required className="h-12 rounded-[var(--radius)] border border-input bg-background px-3 text-sm">
                  <option value="part">Piece</option>
                  <option value="labor">MO</option>
                  <option value="other">Autre</option>
                </select>
                <Input name="description" placeholder="Description *" required className="sm:col-span-3" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Input name="quantity" type="number" step="0.01" min="0.01" placeholder="Qte *" required />
                <Input name="unitPrice" type="number" step="0.01" min="0" placeholder="PU *" required />
                <Input name="vatRate" type="number" step="0.01" defaultValue="20" />
                <Input name="discountPercent" type="number" step="0.01" min="0" max="100" defaultValue="0" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={addLinePending}>
                  {addLinePending ? <Spinner className="h-4 w-4" /> : "Ajouter"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Paiements */}
      {paymentsList.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Paiements</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {paymentsList.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-[var(--radius)] border border-border p-3">
                <CreditCard className="h-4 w-4 text-success" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{formatCurrency(p.amount)} — {methodLabels[p.method] ?? p.method}</p>
                  {p.reference && <p className="text-xs text-muted-foreground">{p.reference}</p>}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(p.paidAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Payment dialog */}
      {showPayment && (
        <div role="dialog" aria-modal="true" aria-labelledby="payment-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader><CardTitle id="payment-title">Enregistrer un paiement</CardTitle></CardHeader>
            <CardContent>
              <form action={paymentFormAction} className="space-y-4">
                <input type="hidden" name="invoiceId" value={inv.id} />
                <div className="space-y-2">
                  <label htmlFor="payment-amount" className="text-sm font-medium">Montant</label>
                  <Input id="payment-amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={remaining.toFixed(2)} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="payment-method" className="text-sm font-medium">Methode</label>
                  <select id="payment-method" name="method" required className="flex h-12 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-base">
                    <option value="card">Carte bancaire</option>
                    <option value="cash">Especes</option>
                    <option value="bank_transfer">Virement</option>
                    <option value="check">Cheque</option>
                    <option value="online">En ligne</option>
                  </select>
                </div>
                <Input name="reference" placeholder="Reference (optionnel)" />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowPayment(false)} aria-label="Annuler le paiement">Annuler</Button>
                  <Button type="submit" disabled={paymentPending}>
                    {paymentPending ? <Spinner className="h-4 w-4" /> : "Enregistrer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
