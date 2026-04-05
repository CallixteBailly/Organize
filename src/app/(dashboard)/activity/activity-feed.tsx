"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { getActivityLogsAction } from "@/server/actions/activity-logs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { SearchInput } from "@/components/ui/search-input";
import { formatDateTime } from "@/lib/utils/format";
import {
  Activity,
  Plus,
  Pencil,
  Trash2,
  ArrowRightLeft,
  Lock,
  Send,
  CreditCard,
  RefreshCw,
  X,
  LogIn,
  Bot,
  User,
  ChevronLeft,
  ChevronRight,
  FileSignature,
} from "lucide-react";

type ActivityItem = {
  id: string;
  userId: string;
  source: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  userName: string;
  userRole: string;
};

const actionConfig: Record<string, { label: string; icon: typeof Plus; color: string }> = {
  create: { label: "Creation", icon: Plus, color: "text-success" },
  update: { label: "Modification", icon: Pencil, color: "text-primary" },
  delete: { label: "Suppression", icon: Trash2, color: "text-destructive" },
  status_change: { label: "Statut", icon: ArrowRightLeft, color: "text-warning" },
  finalize: { label: "Finalisation", icon: Lock, color: "text-primary" },
  send: { label: "Envoi", icon: Send, color: "text-success" },
  payment: { label: "Paiement", icon: CreditCard, color: "text-success" },
  convert: { label: "Conversion", icon: RefreshCw, color: "text-primary" },
  close: { label: "Cloture", icon: X, color: "text-warning" },
  sign: { label: "Signature", icon: FileSignature, color: "text-primary" },
  login: { label: "Connexion", icon: LogIn, color: "text-muted-foreground" },
};

const entityLabels: Record<string, string> = {
  customer: "Client",
  vehicle: "Vehicule",
  invoice: "Facture",
  quote: "Devis",
  repair_order: "Intervention",
  stock: "Stock",
  order: "Commande",
  supplier: "Fournisseur",
  user: "Utilisateur",
  garage: "Garage",
  payment: "Paiement",
  stock_category: "Categorie stock",
};

const roleLabels: Record<string, string> = {
  owner: "Gerant",
  manager: "Responsable",
  mechanic: "Mecanicien",
  secretary: "Secretaire",
};

const entityTypes = [
  { value: "", label: "Toutes les entites" },
  { value: "customer", label: "Clients" },
  { value: "vehicle", label: "Vehicules" },
  { value: "invoice", label: "Factures" },
  { value: "quote", label: "Devis" },
  { value: "repair_order", label: "Interventions" },
  { value: "stock", label: "Stock" },
  { value: "order", label: "Commandes" },
  { value: "supplier", label: "Fournisseurs" },
  { value: "user", label: "Utilisateurs" },
  { value: "garage", label: "Garage" },
  { value: "payment", label: "Paiements" },
];

const sourceOptions = [
  { value: "", label: "Toutes les sources" },
  { value: "user", label: "Utilisateur" },
  { value: "ai", label: "IA" },
];

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPending, startTransition] = useTransition();

  const [entityType, setEntityType] = useState("");
  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(() => {
    startTransition(async () => {
      const result = await getActivityLogsAction({
        page,
        limit: 30,
        entityType: entityType || undefined,
        source: (source as "user" | "ai") || undefined,
        search: searchDebounced || undefined,
      });
      if (result.success && result.data) {
        setItems(result.data.items as ActivityItem[]);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      }
    });
  }, [page, entityType, source, searchDebounced]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [entityType, source, searchDebounced]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput
            placeholder="Rechercher une activite..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-11 rounded-[var(--radius)] border border-input bg-card px-3 text-sm text-foreground"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          aria-label="Filtrer par entite"
        >
          {entityTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          className="h-11 rounded-[var(--radius)] border border-input bg-card px-3 text-sm text-foreground"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          aria-label="Filtrer par source"
        >
          {sourceOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Counter */}
      <p className="text-sm text-muted-foreground">
        {total} activite(s) trouvee(s)
        {isPending && <Spinner className="ml-2 inline h-4 w-4" />}
      </p>

      {/* Activity list */}
      {items.length === 0 && !isPending ? (
        <EmptyState
          icon={Activity}
          title="Aucune activite"
          description="Les actions effectuees dans l'application apparaitront ici"
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const config = actionConfig[item.action] ?? actionConfig.create;
            const Icon = config.icon;
            const isAI = item.source === "ai";

            return (
              <Card key={item.id}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isAI ? "bg-purple-100 dark:bg-purple-900/30" : "bg-muted"}`}>
                    {isAI ? (
                      <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                    ) : (
                      <Icon className={`h-4 w-4 ${config.color}`} aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.description}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" aria-hidden="true" />
                        {item.userName}
                        <span className="text-muted-foreground/60">({roleLabels[item.userRole] ?? item.userRole})</span>
                      </span>
                      <Badge variant={isAI ? "default" : "secondary"} className={isAI ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : ""}>
                        {isAI ? "IA" : "Manuel"}
                      </Badge>
                      <Badge variant="outline">
                        {entityLabels[item.entityType] ?? item.entityType}
                      </Badge>
                      <Badge variant="secondary">
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground whitespace-nowrap" dateTime={new Date(item.createdAt).toISOString()}>
                    {formatDateTime(item.createdAt)}
                  </time>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Page precedente</span>
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Page suivante</span>
          </Button>
        </div>
      )}
    </div>
  );
}
