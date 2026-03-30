import { tool } from "@langchain/core/tools";
import { z } from "zod/v4";
import { eq, and, inArray } from "drizzle-orm";
import { createCustomer } from "@/server/services/customer.service";
import { createVehicle } from "@/server/services/vehicle.service";
import { createRepairOrder } from "@/server/services/repair-order.service";
import { createQuote } from "@/server/services/quote.service";
import { db } from "@/lib/db";
import { repairOrders } from "@/lib/db/schema";
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
      description: "Crée un nouveau client (particulier ou entreprise).",
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
      try {
        const vehicle = await createVehicle(garageId, {
          customerId: input.customerId,
          licensePlate: input.licensePlate.toUpperCase().replace(/[\s\-]/g, ""),
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

  return {
    createCustomer: createCustomerTool,
    createVehicle: createVehicleTool,
    createRepairOrder: createRepairOrderTool,
    createQuoteDraft: createQuoteDraftTool,
    updateRepairOrderStatus: updateRepairOrderStatusTool,
  };
}
