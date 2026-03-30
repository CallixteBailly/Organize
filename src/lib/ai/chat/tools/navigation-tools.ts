import { tool } from "@langchain/core/tools";
import { z } from "zod/v4";

const DESTINATIONS: Record<string, { href: string; label: string }> = {
  dashboard: { href: "/", label: "Tableau de bord" },
  customers: { href: "/customers", label: "Clients" },
  repair_orders: { href: "/repair-orders", label: "Interventions" },
  quotes: { href: "/quotes", label: "Devis" },
  invoices: { href: "/invoices", label: "Factures" },
  stock: { href: "/stock", label: "Stock" },
  catalog: { href: "/catalog", label: "Catalogue pièces" },
  orders: { href: "/orders", label: "Commandes fournisseurs" },
  settings: { href: "/settings/garage", label: "Paramètres" },
};

export function createNavigationTools() {
  return [
    tool(
      async (input: { destination: string; entityId?: string }) => {
        const dest = DESTINATIONS[input.destination];
        if (!dest) {
          return JSON.stringify({ error: `Destination inconnue: ${input.destination}` });
        }
        const href = input.entityId ? `${dest.href}/${input.entityId}` : dest.href;
        return JSON.stringify({ href, label: dest.label });
      },
      {
        name: "navigate_to",
        description:
          "Génère un lien de navigation vers une section de l'application ou vers une entité spécifique.",
        schema: z.object({
          destination: z
            .enum([
              "dashboard",
              "customers",
              "repair_orders",
              "quotes",
              "invoices",
              "stock",
              "catalog",
              "orders",
              "settings",
            ])
            .describe("La section de destination"),
          entityId: z
            .string()
            .optional()
            .describe("UUID de l'entité si on veut accéder à une page de détail"),
        }),
      },
    ),
  ];
}
