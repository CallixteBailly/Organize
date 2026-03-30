import { tool } from "@langchain/core/tools";
import { z } from "zod/v4";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { repairOrders, customers, vehicles } from "@/lib/db/schema";
import { searchCustomers, getCustomerWithVehicles } from "@/server/services/customer.service";
import { getRepairOrderById } from "@/server/services/repair-order.service";
import { searchVehicles } from "@/server/services/vehicle.service";
import { getStockItems } from "@/server/services/stock.service";
import { getDashboardKPIs } from "@/server/services/dashboard.service";
import type { ToolContext } from "../types";

export function createReadTools(ctx: ToolContext) {
  const { garageId } = ctx;

  const searchCustomersTool = tool(
    async (input: { query: string }) => {
      const results = await searchCustomers(garageId, input.query);
      return JSON.stringify(
        results.slice(0, 5).map((c) => ({
          id: c.id,
          type: c.type,
          name:
            c.type === "company"
              ? c.companyName
              : [c.firstName, c.lastName].filter(Boolean).join(" "),
          email: c.email,
          phone: c.phone,
          href: `/customers/${c.id}`,
        })),
      );
    },
    {
      name: "search_customers",
      description: "Recherche des clients par nom, prénom, entreprise, email ou téléphone.",
      schema: z.object({
        query: z.string().min(2).describe("Terme de recherche"),
      }),
    },
  );

  const getCustomerTool = tool(
    async (input: { customerId: string }) => {
      const customer = await getCustomerWithVehicles(garageId, input.customerId);
      if (!customer) return JSON.stringify({ error: "Client non trouvé" });
      return JSON.stringify({
        id: customer.id,
        type: customer.type,
        name:
          customer.type === "company"
            ? customer.companyName
            : [customer.firstName, customer.lastName].filter(Boolean).join(" "),
        email: customer.email,
        phone: customer.phone,
        vehicles: customer.vehicles.map((v) => ({
          id: v.id,
          plate: v.licensePlate,
          brand: v.brand,
          model: v.model,
          year: v.year,
        })),
        href: `/customers/${customer.id}`,
      });
    },
    {
      name: "get_customer",
      description: "Récupère les détails d'un client et ses véhicules par son ID.",
      schema: z.object({
        customerId: z.string().describe("UUID du client"),
      }),
    },
  );

  const searchRepairOrdersTool = tool(
    async (input: { status?: string; limit?: number }) => {
      const limit = Math.min(input.limit ?? 5, 10);

      // Filtre status au niveau DB pour ne pas paginer puis filtrer en mémoire
      const conditions: ReturnType<typeof eq>[] = [eq(repairOrders.garageId, garageId)];
      if (input.status) {
        conditions.push(eq(repairOrders.status, input.status as never));
      }

      const items = await db
        .select({
          repairOrder: repairOrders,
          customerFirstName: customers.firstName,
          customerLastName: customers.lastName,
          customerCompanyName: customers.companyName,
          vehicleBrand: vehicles.brand,
          vehicleModel: vehicles.model,
          vehiclePlate: vehicles.licensePlate,
        })
        .from(repairOrders)
        .innerJoin(customers, eq(repairOrders.customerId, customers.id))
        .innerJoin(vehicles, eq(repairOrders.vehicleId, vehicles.id))
        .where(and(...conditions))
        .orderBy(desc(repairOrders.createdAt))
        .limit(limit);

      return JSON.stringify(
        items.map((i) => ({
          id: i.repairOrder.id,
          number: i.repairOrder.repairOrderNumber,
          status: i.repairOrder.status,
          customer: [i.customerFirstName, i.customerLastName, i.customerCompanyName]
            .filter(Boolean)
            .join(" "),
          vehicle: `${i.vehicleBrand} ${i.vehicleModel} (${i.vehiclePlate})`,
          totalTtc: i.repairOrder.totalTtc,
          href: `/repair-orders/${i.repairOrder.id}`,
        })),
      );
    },
    {
      name: "search_repair_orders",
      description:
        "Liste les interventions, avec filtre optionnel par statut. Statuts : draft, pending, approved, in_progress, completed, invoiced, cancelled.",
      schema: z.object({
        status: z.string().optional().describe("Filtre par statut (optionnel)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe("Nombre maximum de résultats (défaut: 5)"),
      }),
    },
  );

  const getRepairOrderTool = tool(
    async (input: { repairOrderId: string }) => {
      const ro = await getRepairOrderById(garageId, input.repairOrderId);
      if (!ro) return JSON.stringify({ error: "Intervention non trouvée" });
      return JSON.stringify({
        id: ro.repairOrder.id,
        number: ro.repairOrder.repairOrderNumber,
        status: ro.repairOrder.status,
        customer: [ro.customerFirstName, ro.customerLastName, ro.customerCompanyName]
          .filter(Boolean)
          .join(" "),
        vehicle: `${ro.vehicleBrand} ${ro.vehicleModel} (${ro.vehiclePlate})`,
        customerComplaint: ro.repairOrder.customerComplaint,
        diagnosis: ro.repairOrder.diagnosis,
        totalHt: ro.repairOrder.totalHt,
        totalTtc: ro.repairOrder.totalTtc,
        linesCount: ro.lines?.length ?? 0,
        href: `/repair-orders/${ro.repairOrder.id}`,
      });
    },
    {
      name: "get_repair_order",
      description: "Récupère les détails complets d'une intervention par son ID.",
      schema: z.object({
        repairOrderId: z.string().describe("UUID de l'intervention"),
      }),
    },
  );

  const searchStockTool = tool(
    async (input: { query?: string; lowStockOnly?: boolean }) => {
      const { items } = await getStockItems(
        garageId,
        { page: 1, limit: 10 },
        { search: input.query, lowStockOnly: input.lowStockOnly },
      );
      return JSON.stringify(
        items.map((i) => ({
          id: i.id,
          name: i.name,
          reference: i.reference,
          quantity: i.quantity,
          minQuantity: i.minQuantity,
          sellingPrice: i.sellingPrice,
          isLowStock: Number(i.quantity) <= Number(i.minQuantity),
          href: `/stock/${i.id}`,
        })),
      );
    },
    {
      name: "search_stock",
      description: "Recherche des articles en stock. Peut filtrer les articles en alerte de stock.",
      schema: z.object({
        query: z.string().optional().describe("Terme de recherche (nom, référence)"),
        lowStockOnly: z
          .boolean()
          .optional()
          .describe("Si true, retourne uniquement les articles en alerte"),
      }),
    },
  );

  const getDashboardKpisTool = tool(
    async (_input: Record<string, never>) => {
      const kpis = await getDashboardKPIs(garageId);
      return JSON.stringify(kpis);
    },
    {
      name: "get_dashboard_kpis",
      description:
        "Récupère les indicateurs du tableau de bord : CA, interventions en cours, factures impayées, alertes stock.",
      schema: z.object({}),
    },
  );

  const searchVehiclesTool = tool(
    async (input: { query: string }) => {
      const results = await searchVehicles(garageId, input.query);
      return JSON.stringify(
        results.slice(0, 5).map((v) => ({
          id: v.id,
          plate: v.licensePlate,
          brand: v.brand,
          model: v.model,
          year: v.year,
          customerId: v.customerId,
          href: `/vehicles/${v.id}`,
        })),
      );
    },
    {
      name: "search_vehicles",
      description: "Recherche des véhicules par immatriculation, marque ou modèle.",
      schema: z.object({
        query: z.string().min(2).describe("Plaque, marque ou modèle"),
      }),
    },
  );

  return {
    searchCustomers: searchCustomersTool,
    getCustomer: getCustomerTool,
    searchRepairOrders: searchRepairOrdersTool,
    getRepairOrder: getRepairOrderTool,
    searchStock: searchStockTool,
    getDashboardKpis: getDashboardKpisTool,
    searchVehicles: searchVehiclesTool,
  };
}
