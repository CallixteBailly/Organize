"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { Users, UserPlus, Phone, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { AddCustomerDialog } from "./add-customer-dialog";

interface Customer {
  id: string;
  type: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
}

interface CustomerListProps {
  customers: Customer[];
  total: number;
  page: number;
  totalPages: number;
  currentQuery: string;
}

function getDisplayName(c: Customer) {
  if (c.type === "company" && c.companyName) return c.companyName;
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || "Sans nom";
}

export function CustomerList({ customers, total, page, totalPages, currentQuery }: CustomerListProps) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState(currentQuery);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    router.push(`/customers?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex-1">
          <SearchInput
            placeholder="Rechercher par nom, telephone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <Button onClick={() => setShowAdd(true)}>
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun client"
          description={currentQuery ? "Aucun resultat pour cette recherche" : "Ajoutez votre premier client"}
          action={
            !currentQuery ? (
              <Button onClick={() => setShowAdd(true)}>
                <UserPlus className="h-4 w-4" />
                Ajouter un client
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {customers.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`}>
              <Card className="transition-colors hover:bg-secondary/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {(customer.firstName?.[0] ?? customer.companyName?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-foreground">
                        {getDisplayName(customer)}
                      </p>
                      {customer.type === "company" && (
                        <Badge variant="secondary">Entreprise</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </span>
                      )}
                      {customer.email && (
                        <span className="hidden items-center gap-1 sm:flex">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </span>
                      )}
                      {customer.city && <span>{customer.city}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => router.push(`/customers?page=${page - 1}${currentQuery ? `&q=${currentQuery}` : ""}`)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => router.push(`/customers?page=${page + 1}${currentQuery ? `&q=${currentQuery}` : ""}`)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {showAdd && <AddCustomerDialog onClose={() => setShowAdd(false)} />}
    </div>
  );
}
