import { tool } from "@langchain/core/tools";
import { z } from "zod/v4";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { repairOrders, customers, vehicles } from "@/lib/db/schema";
import { searchCustomers, getCustomerWithVehicles } from "@/server/services/customer.service";
import { getRepairOrderById } from "@/server/services/repair-order.service";
import { searchVehicles } from "@/server/services/vehicle.service";
import { getStockItems, getStockItemById } from "@/server/services/stock.service";
import { getQuotes, getQuoteById } from "@/server/services/quote.service";
import { getInvoices, getInvoiceById } from "@/server/services/invoice.service";
import { getOrders, getOrderById } from "@/server/services/order.service";
import { getSuppliers, getSupplierById } from "@/server/services/supplier.service";
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

  const getStockItemTool = tool(
    async (input: { stockItemId: string }) => {
      const item = await getStockItemById(garageId, input.stockItemId);
      if (!item) return JSON.stringify({ error: "Article non trouvé" });
      return JSON.stringify({
        id: item.id,
        name: item.name,
        reference: item.reference,
        barcode: item.barcode,
        brand: item.brand,
        description: item.description,
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice,
        vatRate: item.vatRate,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        maxQuantity: item.maxQuantity,
        location: item.location,
        unit: item.unit,
        isLowStock: Number(item.quantity) <= Number(item.minQuantity),
        href: `/stock/${item.id}`,
      });
    },
    {
      name: "get_stock_item",
      description: "Récupère les détails complets d'un article en stock par son ID.",
      schema: z.object({
        stockItemId: z.string().describe("UUID de l'article"),
      }),
    },
  );

  const searchQuotesTool = tool(
    async (input: { status?: string; limit?: number }) => {
      const limit = Math.min(input.limit ?? 5, 10);
      const { items } = await getQuotes(garageId, { page: 1, limit });
      const filtered = input.status
        ? items.filter((i) => i.quote.status === input.status)
        : items;
      return JSON.stringify(
        filtered.map((i) => ({
          id: i.quote.id,
          number: i.quote.quoteNumber,
          status: i.quote.status,
          customer: [i.customerFirstName, i.customerLastName, i.customerCompanyName]
            .filter(Boolean)
            .join(" "),
          totalTtc: i.quote.totalTtc,
          validUntil: i.quote.validUntil,
          href: `/quotes/${i.quote.id}`,
        })),
      );
    },
    {
      name: "search_quotes",
      description:
        "Liste les devis récents, avec filtre optionnel par statut. Statuts : draft, sent, accepted, rejected, expired, converted.",
      schema: z.object({
        status: z.string().optional().describe("Filtre par statut (optionnel)"),
        limit: z.number().int().min(1).max(10).optional().describe("Nombre max de résultats (défaut: 5)"),
      }),
    },
  );

  const getQuoteTool = tool(
    async (input: { quoteId: string }) => {
      const data = await getQuoteById(garageId, input.quoteId);
      if (!data) return JSON.stringify({ error: "Devis non trouvé" });
      return JSON.stringify({
        id: data.quote.id,
        number: data.quote.quoteNumber,
        status: data.quote.status,
        customer: [data.customerFirstName, data.customerLastName, data.customerCompanyName]
          .filter(Boolean)
          .join(" "),
        totalHt: data.quote.totalHt,
        totalTtc: data.quote.totalTtc,
        validUntil: data.quote.validUntil,
        notes: data.quote.notes,
        linesCount: data.lines?.length ?? 0,
        href: `/quotes/${data.quote.id}`,
      });
    },
    {
      name: "get_quote",
      description: "Récupère les détails complets d'un devis par son ID.",
      schema: z.object({
        quoteId: z.string().describe("UUID du devis"),
      }),
    },
  );

  const searchInvoicesTool = tool(
    async (input: { status?: string; limit?: number }) => {
      const limit = Math.min(input.limit ?? 5, 10);
      const { items } = await getInvoices(garageId, { page: 1, limit });
      const filtered = input.status
        ? items.filter((i) => i.status === input.status)
        : items;
      return JSON.stringify(
        filtered.map((i) => ({
          id: i.id,
          number: i.invoiceNumber,
          status: i.status,
          customerName: i.customerName,
          totalTtc: i.totalTtc,
          amountPaid: i.amountPaid,
          dueDate: i.dueDate,
          href: `/invoices/${i.id}`,
        })),
      );
    },
    {
      name: "search_invoices",
      description:
        "Liste les factures récentes, avec filtre optionnel par statut. Statuts : draft, finalized, sent, partially_paid, paid, overdue, cancelled.",
      schema: z.object({
        status: z.string().optional().describe("Filtre par statut (optionnel)"),
        limit: z.number().int().min(1).max(10).optional().describe("Nombre max de résultats (défaut: 5)"),
      }),
    },
  );

  const getInvoiceTool = tool(
    async (input: { invoiceId: string }) => {
      const data = await getInvoiceById(garageId, input.invoiceId);
      if (!data) return JSON.stringify({ error: "Facture non trouvée" });
      return JSON.stringify({
        id: data.invoice.id,
        number: data.invoice.invoiceNumber,
        status: data.invoice.status,
        customerName: data.invoice.customerName,
        totalHt: data.invoice.totalHt,
        totalTtc: data.invoice.totalTtc,
        amountPaid: data.invoice.amountPaid,
        dueDate: data.invoice.dueDate,
        linesCount: data.lines?.length ?? 0,
        paymentsCount: data.payments?.length ?? 0,
        href: `/invoices/${data.invoice.id}`,
      });
    },
    {
      name: "get_invoice",
      description: "Récupère les détails complets d'une facture par son ID.",
      schema: z.object({
        invoiceId: z.string().describe("UUID de la facture"),
      }),
    },
  );

  const searchOrdersTool = tool(
    async (input: { limit?: number }) => {
      const limit = Math.min(input.limit ?? 5, 10);
      const { items } = await getOrders(garageId, { page: 1, limit });
      return JSON.stringify(
        items.map((i) => ({
          id: i.order.id,
          number: i.order.orderNumber,
          status: i.order.status,
          supplier: i.supplierName,
          totalTtc: i.order.totalTtc,
          createdAt: i.order.createdAt,
          href: `/orders/${i.order.id}`,
        })),
      );
    },
    {
      name: "search_orders",
      description: "Liste les commandes fournisseurs récentes.",
      schema: z.object({
        limit: z.number().int().min(1).max(10).optional().describe("Nombre max de résultats (défaut: 5)"),
      }),
    },
  );

  const getOrderTool = tool(
    async (input: { orderId: string }) => {
      const data = await getOrderById(garageId, input.orderId);
      if (!data) return JSON.stringify({ error: "Commande non trouvée" });
      return JSON.stringify({
        id: data.order.id,
        number: data.order.orderNumber,
        status: data.order.status,
        supplier: data.supplierName,
        totalHt: data.order.totalHt,
        totalTtc: data.order.totalTtc,
        notes: data.order.notes,
        itemsCount: data.items?.length ?? 0,
        deliveredAt: data.order.deliveredAt,
        href: `/orders/${data.order.id}`,
      });
    },
    {
      name: "get_order",
      description: "Récupère les détails complets d'une commande fournisseur par son ID.",
      schema: z.object({
        orderId: z.string().describe("UUID de la commande"),
      }),
    },
  );

  const searchSuppliersTool = tool(
    async () => {
      const results = await getSuppliers(garageId);
      return JSON.stringify(
        results.slice(0, 10).map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          contactName: s.contactName,
          email: s.email,
          phone: s.phone,
          deliveryDays: s.deliveryDays,
        })),
      );
    },
    {
      name: "search_suppliers",
      description: "Liste les fournisseurs actifs du garage.",
      schema: z.object({}),
    },
  );

  const getSupplierTool = tool(
    async (input: { supplierId: string }) => {
      const supplier = await getSupplierById(garageId, input.supplierId);
      if (!supplier) return JSON.stringify({ error: "Fournisseur non trouvé" });
      return JSON.stringify({
        id: supplier.id,
        name: supplier.name,
        code: supplier.code,
        contactName: supplier.contactName,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        website: supplier.website,
        deliveryDays: supplier.deliveryDays,
        minOrderAmount: supplier.minOrderAmount,
      });
    },
    {
      name: "get_supplier",
      description: "Récupère les détails d'un fournisseur par son ID.",
      schema: z.object({
        supplierId: z.string().describe("UUID du fournisseur"),
      }),
    },
  );

  return {
    searchCustomers: searchCustomersTool,
    getCustomer: getCustomerTool,
    searchRepairOrders: searchRepairOrdersTool,
    getRepairOrder: getRepairOrderTool,
    searchStock: searchStockTool,
    getStockItem: getStockItemTool,
    searchQuotes: searchQuotesTool,
    getQuote: getQuoteTool,
    searchInvoices: searchInvoicesTool,
    getInvoice: getInvoiceTool,
    searchOrders: searchOrdersTool,
    getOrder: getOrderTool,
    searchSuppliers: searchSuppliersTool,
    getSupplier: getSupplierTool,
    getDashboardKpis: getDashboardKpisTool,
    searchVehicles: searchVehiclesTool,
  };
}
