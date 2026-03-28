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
  sent: { label: "Envoye", variant: "default" },
  accepted: { label: "Accepte", variant: "success" },
  rejected: { label: "Refuse", variant: "destructive" },
  expired: { label: "Expire", variant: "warning" },
  converted: { label: "Converti en OR", variant: "success" },
};

interface Quote {
  quote: {
    id: string;
    quoteNumber: string;
    status: string;
    totalTtc: string;
    createdAt: Date;
    validUntil: Date | null;
  };
  customerFirstName: string | null;
  customerLastName: string | null;
  customerCompanyName: string | null;
}

interface Props {
  quotes: Quote[];
  page: number;
  totalPages: number;
}

export function QuoteList({ quotes, page, totalPages }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {quotes.length === 0 ? (
        <EmptyState icon={FileText} title="Aucun devis" description="Creez votre premier devis" />
      ) : (
        <div className="space-y-2">
          {quotes.map(({ quote: q, customerFirstName, customerLastName, customerCompanyName }) => {
            const status = statusConfig[q.status] ?? statusConfig.draft;
            const name = customerCompanyName || [customerFirstName, customerLastName].filter(Boolean).join(" ") || "Client";
            return (
              <Link key={q.id} href={`/quotes/${q.id}`}>
                <Card className="transition-colors hover:bg-secondary/50">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium font-mono">{q.quoteNumber}</p>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{name} — {formatDate(q.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold">{formatCurrency(q.totalTtc)}</p>
                      {q.validUntil && <p className="text-xs text-muted-foreground">Valide jusqu&apos;au {formatDate(q.validUntil)}</p>}
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
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => router.push(`/quotes?page=${page - 1}`)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => router.push(`/quotes?page=${page + 1}`)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
