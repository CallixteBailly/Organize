"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Plus, Trash2, ArrowRight, List } from "lucide-react";
import {
  addQuoteLineAction,
  removeQuoteLineAction,
  convertQuoteAction,
  type QuoteActionState,
} from "@/server/actions/quotes";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  sent: { label: "Envoye", variant: "default" },
  accepted: { label: "Accepte", variant: "success" },
  rejected: { label: "Refuse", variant: "destructive" },
  expired: { label: "Expire", variant: "warning" },
  converted: { label: "Converti", variant: "success" },
};

interface Line {
  id: string;
  type: string;
  description: string;
  reference: string | null;
  quantity: string;
  unitPrice: string;
  totalHt: string;
}

interface Props {
  data: {
    quote: {
      id: string;
      quoteNumber: string;
      status: string;
      totalHt: string;
      totalVat: string;
      totalTtc: string;
      validUntil: Date | null;
      notes: string | null;
      createdAt: Date;
      repairOrderId: string | null;
    };
    lines: Line[];
  };
}

const addLineInitial: QuoteActionState = { success: false };

export function QuoteDetail({ data }: Props) {
  const router = useRouter();
  const { quote: q, lines } = data;
  const status = statusConfig[q.status] ?? statusConfig.draft;
  const isEditable = ["draft", "sent"].includes(q.status);
  const canConvert = q.status === "accepted";

  const [addLineState, addLineFormAction, addLinePending] = useActionState(addQuoteLineAction, addLineInitial);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (addLineState.success) toast.success("Ligne ajoutee");
    if (addLineState.error) toast.error(addLineState.error);
  }, [addLineState]);

  async function handleConvert() {
    setConverting(true);
    const result = await convertQuoteAction(q.id);
    setConverting(false);
    if (result.success && result.repairOrderId) {
      toast.success("Devis converti en OR");
      router.push(`/repair-orders/${result.repairOrderId}`);
    } else {
      toast.error(result.error ?? "Erreur");
    }
  }

  async function handleRemoveLine(lineId: string) {
    const result = await removeQuoteLineAction(lineId, q.id);
    if (result.success) toast.success("Ligne supprimee");
    else toast.error(result.error ?? "Erreur");
  }

  return (
    <div className="space-y-6">
      {/* Totaux */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">HT</p>
            <p className="text-lg font-bold">{formatCurrency(q.totalHt)}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">TVA</p>
            <p className="text-lg font-bold">{formatCurrency(q.totalVat)}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">TTC</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(q.totalTtc)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={status.variant}>{status.label}</Badge>
        <span className="text-sm text-muted-foreground">{formatDate(q.createdAt)}</span>
        {q.validUntil && <span className="text-sm text-muted-foreground">Valide jusqu&apos;au {formatDate(q.validUntil)}</span>}
        <div className="flex-1" />
        {canConvert && (
          <Button onClick={handleConvert} disabled={converting}>
            {converting ? <Spinner className="h-4 w-4" /> : <><ArrowRight className="h-4 w-4" /> Convertir en OR</>}
          </Button>
        )}
      </div>

      {q.notes && (
        <Card>
          <CardContent className="pt-4 text-sm text-muted-foreground">{q.notes}</CardContent>
        </Card>
      )}

      {/* Lignes */}
      <Card>
        <CardHeader><CardTitle>Lignes du devis</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {lines.length === 0 ? (
            <EmptyState icon={List} title="Aucune ligne" description="Ajoutez des pieces ou de la main d'oeuvre" className="py-4" />
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
                  {isEditable && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveLine(line.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {isEditable && (
            <form action={addLineFormAction} className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> Ajouter une ligne</p>
              <input type="hidden" name="quoteId" value={q.id} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <select name="type" required className="h-12 rounded-[var(--radius)] border border-input bg-background px-3 text-sm">
                  <option value="part">Piece</option>
                  <option value="labor">Main d&apos;oeuvre</option>
                  <option value="other">Autre</option>
                </select>
                <Input name="description" placeholder="Description *" required className="sm:col-span-3" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Input name="quantity" type="number" step="0.01" min="0.01" placeholder="Qte *" required />
                <Input name="unitPrice" type="number" step="0.01" min="0" placeholder="Prix unit. *" required />
                <Input name="vatRate" type="number" step="0.01" defaultValue="20" placeholder="TVA %" />
                <Input name="discountPercent" type="number" step="0.01" min="0" max="100" defaultValue="0" placeholder="Remise %" />
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
    </div>
  );
}
