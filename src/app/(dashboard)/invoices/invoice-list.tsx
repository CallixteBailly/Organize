"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  finalized: { label: "Finalisee", variant: "default" },
  sent: { label: "Envoyee", variant: "default" },
  paid: { label: "Payee", variant: "success" },
  partially_paid: { label: "Partiel", variant: "warning" },
  overdue: { label: "En retard", variant: "destructive" },
  cancelled: { label: "Annulee", variant: "destructive" },
};

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  customerName: string;
  totalTtc: string;
  amountPaid: string;
  issueDate: Date;
  dueDate: Date;
}

interface Props {
  invoices: Invoice[];
  page: number;
  totalPages: number;
}

export function InvoiceList({ invoices: items, page, totalPages }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <EmptyState icon={FileText} title="Aucune facture" description="Les factures apparaitront ici apres cloture d'un OR" />
      ) : (
        <div className="space-y-2">
          {items.map((inv) => {
            const status = statusConfig[inv.status] ?? statusConfig.draft;
            const remaining = Number(inv.totalTtc) - Number(inv.amountPaid);
            return (
              <Link key={inv.id} href={`/invoices/${inv.id}`}>
                <Card className="transition-colors hover:bg-secondary/50">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium font-mono">{inv.invoiceNumber}</p>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {inv.customerName} — {formatDate(inv.issueDate)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold">{formatCurrency(inv.totalTtc)}</p>
                      {remaining > 0 && inv.status !== "draft" && (
                        <p className="text-xs text-destructive">Reste: {formatCurrency(remaining)}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Ech. {formatDate(inv.dueDate)}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => router.push(`/invoices?page=${page - 1}`)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => router.push(`/invoices?page=${page + 1}`)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
