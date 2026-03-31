import { tool } from "@langchain/core/tools";
import { z } from "zod/v4";
import { eq, and, or, ilike, inArray } from "drizzle-orm";
import { createCustomer, updateCustomer } from "@/server/services/customer.service";
import { createVehicle, updateVehicle } from "@/server/services/vehicle.service";
import { createRepairOrder, updateRepairOrder } from "@/server/services/repair-order.service";
import { createQuote } from "@/server/services/quote.service";
import { createStockItem, updateStockItem } from "@/server/services/stock.service";
import { createInvoice, addInvoiceLine } from "@/server/services/invoice.service";
import { updateOrderStatus } from "@/server/services/order.service";
import { createSupplier, updateSupplier } from "@/server/services/supplier.service";
import { db } from "@/lib/db";
import { repairOrders, customers, vehicles, stockItems, suppliers } from "@/lib/db/schema";
import type { ToolContext } from "../types";

function sanitizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  return phone.replace(/[\s.\-()]/g, "");
}

// Statuts cibles sûrs (pas de closeRepairOrder qui décompte le stock)
const SAFE_TARGET_STATUSES = ["pending", "approved", "in_progress"] as const;
const SAFE_SOURCE_STATUSES = ["draft", "pending", "approved"] as const;

export function createWriteTools(ctx: ToolContext) {
  const { garageId, userId } = ctx;

  const createCustomerTool = tool(
    async (input: {
      type: "individual" | "company";
      firstName?: string;
      lastName?: string;
      companyName?: string;
      phone?: string;
      email?: string;
    }) => {
      // Valider les champs requis selon le type
      if (input.type === "individual" && !input.firstName && !input.lastName) {
        return JSON.stringify({ error: "Le prenom ou le nom est requis pour un particulier." });
      }
      if (input.type === "company" && !input.companyName) {
        return JSON.stringify({ error: "Le nom de l'entreprise est requis." });
      }

      const phone = sanitizePhone(input.phone);

      // Vérifier les doublons par téléphone, email ou nom
      const dupConditions = [];
      if (phone) dupConditions.push(eq(customers.phone, phone));
      if (input.email) dupConditions.push(eq(customers.email, input.email.trim().toLowerCase()));
      if (input.companyName) dupConditions.push(ilike(customers.companyName, input.companyName.trim()));
      if (input.firstName && input.lastName) {
        dupConditions.push(
          and(ilike(customers.firstName, input.firstName.trim()), ilike(customers.lastName, input.lastName.trim()))!,
        );
      }

      if (dupConditions.length > 0) {
        const [existing] = await db
          .select()
          .from(customers)
          .where(and(eq(customers.garageId, garageId), or(...dupConditions)))
          .limit(1);
        if (existing) {
          const existingName = existing.type === "company"
            ? existing.companyName
            : [existing.firstName, existing.lastName].filter(Boolean).join(" ");
          return JSON.stringify({
            error: `Un client similaire existe déjà : ${existingName} (${existing.phone || existing.email || ""}). Utilisez update_customer pour le modifier.`,
            existingId: existing.id,
            existingName,
          });
        }
      }

      try {
        const customer = await createCustomer(garageId, {
          type: input.type,
          firstName: input.firstName?.trim() || undefined,
          lastName: input.lastName?.trim() || undefined,
          companyName: input.companyName?.trim() || undefined,
          phone,
          email: input.email?.trim()?.toLowerCase() || undefined,
        });
        const name =
          input.type === "company"
            ? input.companyName
            : [input.firstName, input.lastName].filter(Boolean).join(" ");
        return JSON.stringify({
          id: customer.id,
          name,
          href: `/customers/${customer.id}`,
          label: `Voir la fiche client — ${name}`,
        });
      } catch (error) {
        console.error("[AI Tool] create_customer error:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        return JSON.stringify({ error: `Echec de la creation du client : ${message}` });
      }
    },
    {
      name: "create_customer",
      description:
        "Crée un nouveau client (particulier ou entreprise). Vérifie les doublons avant création.",
      schema: z.object({
        type: z.enum(["individual", "company"]).describe("Type de client"),
        firstName: z.string().optional().describe("Prénom (particulier)"),
        lastName: z.string().optional().describe("Nom (particulier)"),
        companyName: z.string().optional().describe("Nom de l'entreprise"),
        phone: z.string().optional().describe("Téléphone"),
        email: z.string().optional().describe("Email"),
      }),
    },
  );

  const createVehicleTool = tool(
    async (input: {
      customerId: string;
      licensePlate: string;
      brand: string;
      model: string;
      year?: number;
      mileage?: number;
    }) => {
      const plate = input.licensePlate.toUpperCase().replace(/[\s\-]/g, "");

      // Vérifier doublon par plaque d'immatriculation
      const [existing] = await db
        .select()
        .from(vehicles)
        .where(and(eq(vehicles.garageId, garageId), eq(vehicles.licensePlate, plate)))
        .limit(1);
      if (existing) {
        return JSON.stringify({
          error: `Un véhicule avec la plaque ${plate} existe déjà : ${existing.brand} ${existing.model}. Utilisez update_vehicle pour le modifier.`,
          existingId: existing.id,
        });
      }

      try {
        const vehicle = await createVehicle(garageId, {
          customerId: input.customerId,
          licensePlate: plate,
          brand: input.brand.trim(),
          model: input.model.trim(),
          year: input.year,
          mileage: input.mileage,
        });
        return JSON.stringify({
          id: vehicle.id,
          plate: vehicle.licensePlate,
          brand: vehicle.brand,
          model: vehicle.model,
          href: `/vehicles/${vehicle.id}`,
          label: `Voir le véhicule — ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
        });
      } catch (error) {
        console.error("[AI Tool] create_vehicle error:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        return JSON.stringify({ error: `Echec de la creation du vehicule : ${message}` });
      }
    },
    {
      name: "create_vehicle",
      description: "Crée un véhicule et l'associe à un client existant.",
      schema: z.object({
        customerId: z.string().describe("UUID du client propriétaire"),
        licensePlate: z.string().min(1).describe("Immatriculation"),
        brand: z.string().min(1).describe("Marque"),
        model: z.string().min(1).describe("Modèle"),
        year: z.number().int().optional().describe("Année"),
        mileage: z.number().int().optional().describe("Kilométrage"),
      }),
    },
  );

  const createRepairOrderTool = tool(
    async (input: {
      customerId: string;
      vehicleId: string;
      customerComplaint?: string;
      mileageAtIntake?: number;
    }) => {
      try {
        const ro = await createRepairOrder(garageId, userId, {
          customerId: input.customerId,
          vehicleId: input.vehicleId,
          customerComplaint: input.customerComplaint?.trim(),
          mileageAtIntake: input.mileageAtIntake,
        });
        return JSON.stringify({
          id: ro.id,
          number: ro.repairOrderNumber,
          status: ro.status,
          href: `/repair-orders/${ro.id}`,
          label: `Voir l'intervention — ${ro.repairOrderNumber}`,
        });
      } catch (error) {
        console.error("[AI Tool] create_repair_order error:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        return JSON.stringify({ error: `Echec de la creation de l'intervention : ${message}` });
      }
    },
    {
      name: "create_repair_order",
      description:
        "Crée une nouvelle intervention (ordre de réparation) pour un client et son véhicule.",
      schema: z.object({
        customerId: z.string().describe("UUID du client"),
        vehicleId: z.string().describe("UUID du véhicule"),
        customerComplaint: z.string().optional().describe("Plainte ou description du problème"),
        mileageAtIntake: z.number().int().optional().describe("Kilométrage à la prise en charge"),
      }),
    },
  );

  const createQuoteDraftTool = tool(
    async (input: { customerId: string; vehicleId?: string; notes?: string }) => {
      try {
        const quote = await createQuote(garageId, userId, {
          customerId: input.customerId,
          vehicleId: input.vehicleId || "",
          notes: input.notes?.trim(),
          validUntil: undefined,
        });
        return JSON.stringify({
          id: quote.id,
          number: quote.quoteNumber,
          href: `/quotes/${quote.id}`,
          label: `Voir le devis — ${quote.quoteNumber}`,
        });
      } catch (error) {
        console.error("[AI Tool] create_quote_draft error:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        return JSON.stringify({ error: `Echec de la creation du devis : ${message}` });
      }
    },
    {
      name: "create_quote_draft",
      description: "Crée un devis brouillon pour un client.",
      schema: z.object({
        customerId: z.string().describe("UUID du client"),
        vehicleId: z.string().optional().describe("UUID du véhicule (optionnel)"),
        notes: z.string().optional().describe("Notes ou description des travaux"),
      }),
    },
  );

  const updateRepairOrderStatusTool = tool(
    async (input: {
      repairOrderId: string;
      status: (typeof SAFE_TARGET_STATUSES)[number];
    }) => {
      const [updated] = await db
        .update(repairOrders)
        .set({ status: input.status, updatedAt: new Date() })
        .where(
          and(
            eq(repairOrders.id, input.repairOrderId),
            eq(repairOrders.garageId, garageId),
            inArray(repairOrders.status, [...SAFE_SOURCE_STATUSES]),
          ),
        )
        .returning({
          id: repairOrders.id,
          number: repairOrders.repairOrderNumber,
          status: repairOrders.status,
        });

      if (!updated) {
        return JSON.stringify({
          error:
            "Impossible de mettre à jour le statut. L'intervention est peut-être déjà dans un état avancé.",
        });
      }
      return JSON.stringify({
        id: updated.id,
        number: updated.number,
        newStatus: updated.status,
        href: `/repair-orders/${updated.id}`,
        label: `Voir l'intervention — ${updated.number}`,
      });
    },
    {
      name: "update_repair_order_status",
      description:
        "Met à jour le statut d'une intervention. Statuts autorisés : pending, approved, in_progress.",
      schema: z.object({
        repairOrderId: z.string().describe("UUID de l'intervention"),
        status: z
          .enum(SAFE_TARGET_STATUSES)
          .describe("Nouveau statut : pending | approved | in_progress"),
      }),
    },
  );

  const updateCustomerTool = tool(
    async (input: {
      customerId: string;
      firstName?: string;
      lastName?: string;
      companyName?: string;
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
      postalCode?: string;
    }) => {
      const { customerId, ...fields } = input;
      const data: Record<string, unknown> = {};
      if (fields.firstName !== undefined) data.firstName = fields.firstName.trim();
      if (fields.lastName !== undefined) data.lastName = fields.lastName.trim();
      if (fields.companyName !== undefined) data.companyName = fields.companyName.trim();
      if (fields.phone !== undefined) data.phone = sanitizePhone(fields.phone);
      if (fields.email !== undefined) data.email = fields.email.trim().toLowerCase();
      if (fields.address !== undefined) data.address = fields.address.trim();
      if (fields.city !== undefined) data.city = fields.city.trim();
      if (fields.postalCode !== undefined) data.postalCode = fields.postalCode.trim();

      try {
        const updated = await updateCustomer(garageId, customerId, data);
        if (!updated) return JSON.stringify({ error: "Client non trouvé." });
        const name =
          updated.type === "company"
            ? updated.companyName
            : [updated.firstName, updated.lastName].filter(Boolean).join(" ");
        return JSON.stringify({
          id: updated.id,
          name,
          href: `/customers/${updated.id}`,
          label: `Voir la fiche client — ${name}`,
        });
      } catch (error) {
        console.error("[AI Tool] update_customer error:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        return JSON.stringify({ error: `Echec de la modification du client : ${message}` });
      }
    },
    {
      name: "update_customer",
      description: "Modifie les informations d'un client existant.",
      schema: z.object({
        customerId: z.string().describe("UUID du client"),
        firstName: z.string().optional().describe("Nouveau prénom"),
        lastName: z.string().optional().describe("Nouveau nom"),
        companyName: z.string().optional().describe("Nouveau nom d'entreprise"),
        phone: z.string().optional().describe("Nouveau téléphone"),
        email: z.string().optional().describe("Nouvel email"),
        address: z.string().optional().describe("Nouvelle adresse"),
        city: z.string().optional().describe("Nouvelle ville"),
        postalCode: z.string().optional().describe("Nouveau code postal"),
      }),
    },
  );

  const updateVehicleTool = tool(
    async (input: {
      vehicleId: string;
      licensePlate?: string;
      brand?: string;
      model?: string;
      year?: number;
      mileage?: number;
    }) => {
      const { vehicleId, ...fields } = input;
      const data: Record<string, unknown> = {};
      if (fields.licensePlate !== undefined)
        data.licensePlate = fields.licensePlate.toUpperCase().replace(/[\s\-]/g, "");
      if (fields.brand !== undefined) data.brand = fields.brand.trim();
      if (fields.model !== undefined) data.model = fields.model.trim();
      if (fields.year !== undefined) data.year = fields.year;
      if (fields.mileage !== undefined) data.mileage = fields.mileage;

      try {
        const updated = await updateVehicle(garageId, vehicleId, data);
        if (!updated) return JSON.stringify({ error: "Véhicule non trouvé." });
        return JSON.stringify({
          id: updated.id,
          plate: updated.licensePlate,
          brand: updated.brand,
          model: updated.model,
          href: `/vehicles/${updated.id}`,
          label: `Voir le véhicule — ${updated.brand} ${updated.model} (${updated.licensePlate})`,
        });
      } catch (error) {
        console.error("[AI Tool] update_vehicle error:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        return JSON.stringify({ error: `Echec de la modification du véhicule : ${message}` });
      }
    },
    {
      name: "update_vehicle",
      description: "Modifie les informations d'un véhicule existant.",
      schema: z.object({
        vehicleId: z.string().describe("UUID du véhicule"),
        licensePlate: z.string().optional().describe("Nouvelle immatriculation"),
        brand: z.string().optional().describe("Nouvelle marque"),
        model: z.string().optional().describe("Nouveau modèle"),
        year: z.number().int().optional().describe("Nouvelle année"),
        mileage: z.number().int().optional().describe("Nouveau kilométrage"),
      }),
    },
  );

  const createStockItemTool = tool(
    async (input: {
      name: string;
      reference: string;
      purchasePrice?: number;
      sellingPrice: number;
      quantity?: number;
      minQuantity?: number;
      brand?: string;
      barcode?: string;
      description?: string;
      location?: string;
      vatRate?: number;
    }) => {
      // Vérifier doublon par référence
      const [existing] = await db
        .select()
        .from(stockItems)
        .where(and(eq(stockItems.garageId, garageId), eq(stockItems.reference, input.reference.trim())))
        .limit(1);
      if (existing) {
        return JSON.stringify({
          error: `Un article avec la référence ${input.reference.trim()} existe déjà : ${existing.name}. Utilisez update_stock_item pour le modifier.`,
          existingId: existing.id,
        });
      }

      try {
        const item = await createStockItem(garageId, {
          name: input.name.trim(),
          reference: input.reference.trim(),
          purchasePrice: input.purchasePrice,
          sellingPrice: input.sellingPrice,
          quantity: input.quantity ?? 0,
          minQuantity: input.minQuantity ?? 0,
          brand: input.brand?.trim(),
          barcode: input.barcode?.trim(),
          description: input.description?.trim(),
          location: input.location?.trim(),
          vatRate: input.vatRate ?? 20,
          unit: "piece",
        });
        return JSON.stringify({
          id: item.id,
          name: item.name,
          reference: item.reference,
          quantity: item.quantity,
          href: `/stock/${item.id}`,
          label: `Voir l'article — ${item.name} (${item.reference})`,
        });
      } catch (error) {
        console.error("[AI Tool] create_stock_item error:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        return JSON.stringify({ error: `Echec de la création de l'article : ${message}` });
      }
    },
    {
      name: "create_stock_item",
      description: "Crée un nouvel article en stock.",
      schema: z.object({
        name: z.string().min(1).describe("Désignation de l'article"),
        reference: z.string().min(1).describe("Référence de l'article"),
        purchasePrice: z.number().min(0).optional().describe("Prix d'achat HT en euros"),
        sellingPrice: z.number().min(0).describe("Prix de vente HT en euros"),
        quantity: z.number().int().min(0).optional().describe("Quantité initiale en stock (défaut: 0)"),
        minQuantity: z.number().int().min(0).optional().describe("Seuil d'alerte stock bas (défaut: 0)"),
        brand: z.string().optional().describe("Marque de l'article"),
        barcode: z.string().optional().describe("Code-barres"),
        description: z.string().optional().describe("Description de l'article"),
        location: z.string().optional().describe("Emplacement dans le stock"),
        vatRate: z.number().min(0).max(100).optional().describe("Taux de TVA en % (défaut: 20)"),
      }),
    },
  );

  const updateStockItemTool = tool(
    async (input: {
      stockItemId: string;
      name?: string;
      reference?: string;
      purchasePrice?: number;
      sellingPrice?: number;
      quantity?: number;
      minQuantity?: number;
      brand?: string;
      barcode?: string;
      description?: string;
      location?: string;
      vatRate?: number;
    }) => {
      const { stockItemId, ...fields } = input;
      const data: Record<string, unknown> = {};
      if (fields.name !== undefined) data.name = fields.name.trim();
      if (fields.reference !== undefined) data.reference = fields.reference.trim();
      if (fields.purchasePrice !== undefined) data.purchasePrice = fields.purchasePrice;
      if (fields.sellingPrice !== undefined) data.sellingPrice = fields.sellingPrice;
      if (fields.quantity !== undefined) data.quantity = fields.quantity;
      if (fields.minQuantity !== undefined) data.minQuantity = fields.minQuantity;
      if (fields.brand !== undefined) data.brand = fields.brand.trim();
      if (fields.barcode !== undefined) data.barcode = fields.barcode.trim();
      if (fields.description !== undefined) data.description = fields.description.trim();
      if (fields.location !== undefined) data.location = fields.location.trim();
      if (fields.vatRate !== undefined) data.vatRate = fields.vatRate;

      try {
        const updated = await updateStockItem(garageId, stockItemId, data);
        if (!updated) return JSON.stringify({ error: "Article non trouvé." });
        return JSON.stringify({
          id: updated.id,
          name: updated.name,
          reference: updated.reference,
          quantity: updated.quantity,
          href: `/stock/${updated.id}`,
          label: `Voir l'article — ${updated.name} (${updated.reference})`,
        });
      } catch (error) {
        console.error("[AI Tool] update_stock_item error:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        return JSON.stringify({ error: `Echec de la modification de l'article : ${message}` });
      }
    },
    {
      name: "update_stock_item",
      description: "Modifie un article en stock existant.",
      schema: z.object({
        stockItemId: z.string().describe("UUID de l'article"),
        name: z.string().optional().describe("Nouvelle désignation"),
        reference: z.string().optional().describe("Nouvelle référence"),
        purchasePrice: z.number().min(0).optional().describe("Nouveau prix d'achat HT"),
        sellingPrice: z.number().min(0).optional().describe("Nouveau prix de vente HT"),
        quantity: z.number().int().min(0).optional().describe("Nouvelle quantité"),
        minQuantity: z.number().int().min(0).optional().describe("Nouveau seuil d'alerte"),
        brand: z.string().optional().describe("Nouvelle marque"),
        barcode: z.string().optional().describe("Nouveau code-barres"),
        description: z.string().optional().describe("Nouvelle description"),
        location: z.string().optional().describe("Nouvel emplacement"),
        vatRate: z.number().min(0).max(100).optional().describe("Nouveau taux de TVA en %"),
      }),
    },
  );

  const updateRepairOrderTool = tool(
    async (input: {
      repairOrderId: string;
      diagnosis?: string;
      workPerformed?: string;
      customerComplaint?: string;
    }) => {
      const { repairOrderId, ...fields } = input;
      const data: Record<string, unknown> = {};
      if (fields.diagnosis !== undefined) data.diagnosis = fields.diagnosis.trim();
      if (fields.workPerformed !== undefined) data.workPerformed = fields.workPerformed.trim();
      if (fields.customerComplaint !== undefined) data.customerComplaint = fields.customerComplaint.trim();

      try {
        const updated = await updateRepairOrder(garageId, repairOrderId, data);
        if (!updated) return JSON.stringify({ error: "Intervention non trouvée." });
        return JSON.stringify({
          id: updated.id,
          number: updated.repairOrderNumber,
          status: updated.status,
          href: `/repair-orders/${updated.id}`,
          label: `Voir l'intervention — ${updated.repairOrderNumber}`,
        });
      } catch (error) {
        console.error("[AI Tool] update_repair_order error:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        return JSON.stringify({ error: `Echec de la modification : ${message}` });
      }
    },
    {
      name: "update_repair_order",
      description:
        "Modifie une intervention existante (diagnostic, travaux effectués, plainte client).",
      schema: z.object({
        repairOrderId: z.string().describe("UUID de l'intervention"),
        diagnosis: z.string().optional().describe("Nouveau diagnostic"),
        workPerformed: z.string().optional().describe("Travaux effectués"),
        customerComplaint: z.string().optional().describe("Nouvelle plainte client"),
      }),
    },
  );

  const createInvoiceTool = tool(
    async (input: {
      customerId: string;
      repairOrderId?: string;
      notes?: string;
      paymentTerms?: string;
      lines?: { type: "part" | "labor" | "other"; description: string; quantity: number; unitPrice: number; vatRate?: number }[];
    }) => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      try {
        const invoice = await createInvoice(garageId, userId, {
          customerId: input.customerId,
          repairOrderId: input.repairOrderId,
          dueDate,
          notes: input.notes?.trim(),
          paymentTerms: input.paymentTerms?.trim(),
        });

        // Ajouter les lignes si fournies
        if (input.lines && input.lines.length > 0) {
          for (const line of input.lines) {
            await addInvoiceLine(garageId, {
              invoiceId: invoice.id,
              type: line.type,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              vatRate: line.vatRate ?? 20,
              discountPercent: 0,
            });
          }
        }

        return JSON.stringify({
          id: invoice.id,
          number: invoice.invoiceNumber,
          linesCount: input.lines?.length ?? 0,
          href: `/invoices/${invoice.id}`,
          label: `Voir la facture — ${invoice.invoiceNumber}`,
        });
      } catch (error) {
        console.error("[AI Tool] create_invoice error:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        return JSON.stringify({ error: `Echec de la création de la facture : ${message}` });
      }
    },
    {
      name: "create_invoice",
      description:
        "Crée une facture brouillon pour un client avec ses lignes. L'échéance est fixée à 30 jours par défaut. NE JAMAIS finaliser une facture.",
      schema: z.object({
        customerId: z.string().describe("UUID du client"),
        repairOrderId: z.string().optional().describe("UUID de l'intervention liée (optionnel)"),
        notes: z.string().optional().describe("Notes sur la facture"),
        paymentTerms: z.string().optional().describe("Conditions de paiement"),
        lines: z.array(z.object({
          type: z.enum(["part", "labor", "other"]).describe("Type : part (pièce), labor (main d'oeuvre), other"),
          description: z.string().describe("Description de la prestation ou pièce"),
          quantity: z.number().describe("Quantité"),
          unitPrice: z.number().describe("Prix unitaire HT"),
          vatRate: z.number().optional().describe("Taux de TVA en % (défaut 20)"),
        })).optional().describe("Lignes de la facture"),
      }),
    },
  );

  const createSupplierTool = tool(
    async (input: {
      name: string;
      code?: string;
      contactName?: string;
      email?: string;
      phone?: string;
      address?: string;
      website?: string;
      deliveryDays?: number;
    }) => {
      // Vérifier doublon par nom
      const [existing] = await db
        .select()
        .from(suppliers)
        .where(and(eq(suppliers.garageId, garageId), ilike(suppliers.name, input.name.trim())))
        .limit(1);
      if (existing) {
        return JSON.stringify({
          error: `Un fournisseur nommé "${existing.name}" existe déjà. Utilisez update_supplier pour le modifier.`,
          existingId: existing.id,
        });
      }

      try {
        const supplier = await createSupplier(garageId, {
          name: input.name.trim(),
          code: input.code?.trim(),
          contactName: input.contactName?.trim(),
          email: input.email?.trim().toLowerCase(),
          phone: input.phone ? sanitizePhone(input.phone) : undefined,
          address: input.address?.trim(),
          website: input.website?.trim(),
          deliveryDays: input.deliveryDays,
        });
        return JSON.stringify({
          id: supplier.id,
          name: supplier.name,
          href: `/settings/suppliers`,
          label: `Voir les fournisseurs — ${supplier.name}`,
        });
      } catch (error) {
        console.error("[AI Tool] create_supplier error:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        return JSON.stringify({ error: `Echec de la création du fournisseur : ${message}` });
      }
    },
    {
      name: "create_supplier",
      description: "Crée un nouveau fournisseur.",
      schema: z.object({
        name: z.string().min(1).describe("Nom du fournisseur"),
        code: z.string().optional().describe("Code fournisseur"),
        contactName: z.string().optional().describe("Nom du contact"),
        email: z.string().optional().describe("Email"),
        phone: z.string().optional().describe("Téléphone"),
        address: z.string().optional().describe("Adresse"),
        website: z.string().optional().describe("Site web"),
        deliveryDays: z.number().int().min(0).optional().describe("Délai de livraison en jours"),
      }),
    },
  );

  const updateSupplierTool = tool(
    async (input: {
      supplierId: string;
      name?: string;
      code?: string;
      contactName?: string;
      email?: string;
      phone?: string;
      address?: string;
      website?: string;
      deliveryDays?: number;
    }) => {
      const { supplierId, ...fields } = input;
      const data: Record<string, unknown> = {};
      if (fields.name !== undefined) data.name = fields.name.trim();
      if (fields.code !== undefined) data.code = fields.code.trim();
      if (fields.contactName !== undefined) data.contactName = fields.contactName.trim();
      if (fields.email !== undefined) data.email = fields.email.trim().toLowerCase();
      if (fields.phone !== undefined) data.phone = sanitizePhone(fields.phone);
      if (fields.address !== undefined) data.address = fields.address.trim();
      if (fields.website !== undefined) data.website = fields.website.trim();
      if (fields.deliveryDays !== undefined) data.deliveryDays = fields.deliveryDays;

      try {
        const updated = await updateSupplier(garageId, supplierId, data);
        if (!updated) return JSON.stringify({ error: "Fournisseur non trouvé." });
        return JSON.stringify({
          id: updated.id,
          name: updated.name,
          href: `/settings/suppliers`,
          label: `Voir les fournisseurs — ${updated.name}`,
        });
      } catch (error) {
        console.error("[AI Tool] update_supplier error:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        return JSON.stringify({ error: `Echec de la modification du fournisseur : ${message}` });
      }
    },
    {
      name: "update_supplier",
      description: "Modifie les informations d'un fournisseur existant.",
      schema: z.object({
        supplierId: z.string().describe("UUID du fournisseur"),
        name: z.string().optional().describe("Nouveau nom"),
        code: z.string().optional().describe("Nouveau code"),
        contactName: z.string().optional().describe("Nouveau nom de contact"),
        email: z.string().optional().describe("Nouvel email"),
        phone: z.string().optional().describe("Nouveau téléphone"),
        address: z.string().optional().describe("Nouvelle adresse"),
        website: z.string().optional().describe("Nouveau site web"),
        deliveryDays: z.number().int().min(0).optional().describe("Nouveau délai de livraison"),
      }),
    },
  );

  const SAFE_ORDER_STATUSES = ["confirmed", "shipped", "delivered", "cancelled"] as const;

  const updateOrderStatusTool = tool(
    async (input: {
      orderId: string;
      status: (typeof SAFE_ORDER_STATUSES)[number];
    }) => {
      try {
        const updated = await updateOrderStatus(garageId, input.orderId, input.status);
        if (!updated) return JSON.stringify({ error: "Commande non trouvée." });
        return JSON.stringify({
          id: updated.id,
          number: updated.orderNumber,
          newStatus: updated.status,
          href: `/orders/${updated.id}`,
          label: `Voir la commande — ${updated.orderNumber}`,
        });
      } catch (error) {
        console.error("[AI Tool] update_order_status error:", error);
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        return JSON.stringify({ error: `Echec de la mise à jour : ${message}` });
      }
    },
    {
      name: "update_order_status",
      description:
        "Met à jour le statut d'une commande fournisseur. Statuts : confirmed, shipped, delivered, cancelled.",
      schema: z.object({
        orderId: z.string().describe("UUID de la commande"),
        status: z
          .enum(SAFE_ORDER_STATUSES)
          .describe("Nouveau statut : confirmed | shipped | delivered | cancelled"),
      }),
    },
  );

  return {
    createCustomer: createCustomerTool,
    createVehicle: createVehicleTool,
    createRepairOrder: createRepairOrderTool,
    createQuoteDraft: createQuoteDraftTool,
    updateRepairOrderStatus: updateRepairOrderStatusTool,
    updateCustomer: updateCustomerTool,
    updateVehicle: updateVehicleTool,
    createStockItem: createStockItemTool,
    updateStockItem: updateStockItemTool,
    updateRepairOrder: updateRepairOrderTool,
    createInvoice: createInvoiceTool,
    createSupplier: createSupplierTool,
    updateSupplier: updateSupplierTool,
    updateOrderStatus: updateOrderStatusTool,
  };
}
