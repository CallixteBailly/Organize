import { parseIntervention } from "@/lib/ai/ai-service";
import { searchCustomers, createCustomer } from "./customer.service";
import { searchVehicleByPlate, searchVehicles, createVehicle } from "./vehicle.service";
import {
  createRepairOrder,
  addRepairOrderLine,
  closeRepairOrder,
} from "./repair-order.service";
import {
  generateInvoiceFromRepairOrder,
  finalizeInvoice,
  recordPayment,
} from "./invoice.service";
import { db } from "@/lib/db";
import { garages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type {
  QuickCapturePreview,
  QuickCaptureConfirmInput,
  QuickCaptureResult,
  CustomerMatch,
  VehicleMatch,
} from "@/server/validators/quick-capture";

// ── Parse : appel IA (Z.AI) + fuzzy match ──

export async function parseQuickCapture(
  garageId: string,
  text: string,
): Promise<QuickCapturePreview> {
  const parsed = await parseIntervention(text);

  // Fuzzy match client
  const customerMatches = await fuzzyMatchCustomers(garageId, parsed);

  // Fuzzy match véhicule
  const vehicleMatches = await fuzzyMatchVehicles(garageId, parsed);

  return {
    parsed,
    customerMatches,
    vehicleMatches,
    rawText: text,
  };
}

async function fuzzyMatchCustomers(
  garageId: string,
  parsed: { customer: { firstName?: string | null; lastName?: string | null; companyName?: string | null } },
): Promise<CustomerMatch[]> {
  const { firstName, lastName, companyName } = parsed.customer;
  const query = companyName ?? lastName ?? firstName ?? "";
  if (!query) return [];

  const results = await searchCustomers(garageId, query);
  return results.slice(0, 5).map((c: typeof results[number]) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    companyName: c.companyName,
  }));
}

async function fuzzyMatchVehicles(
  garageId: string,
  parsed: { vehicle: { brand?: string | null; model?: string | null; licensePlate?: string | null } },
): Promise<VehicleMatch[]> {
  const { brand, model, licensePlate } = parsed.vehicle;

  // Recherche par plaque en priorité (match exact normalisé)
  if (licensePlate) {
    const byPlate = await searchVehicleByPlate(garageId, licensePlate);
    if (byPlate.length > 0) {
      return byPlate.map((v: typeof byPlate[number]) => ({
        id: v.id,
        brand: v.brand,
        model: v.model,
        licensePlate: v.licensePlate,
        customerId: v.customerId,
      }));
    }
  }

  // Sinon recherche par marque/modèle
  const query = [brand, model].filter(Boolean).join(" ");
  if (!query) return [];

  const results = await searchVehicles(garageId, query);
  return results.slice(0, 5).map((v: typeof results[number]) => ({
    id: v.id,
    brand: v.brand,
    model: v.model,
    licensePlate: v.licensePlate,
    customerId: v.customerId,
  }));
}

// ── Confirm : création séquentielle des entités ──

export async function confirmQuickCapture(
  garageId: string,
  userId: string,
  data: QuickCaptureConfirmInput,
): Promise<QuickCaptureResult> {
  // 1. Client
  let customerId: string;
  if (data.customer.existingId) {
    customerId = data.customer.existingId;
  } else {
    const newCustomer = await createCustomer(garageId, {
      type: data.customer.companyName ? "company" : "individual",
      firstName: data.customer.firstName,
      lastName: data.customer.lastName,
      companyName: data.customer.companyName,
    });
    customerId = newCustomer.id;
  }

  // 2. Véhicule
  let vehicleId: string;
  if (data.vehicle.existingId) {
    vehicleId = data.vehicle.existingId;
  } else {
    const licensePlate = data.vehicle.licensePlate
      ? data.vehicle.licensePlate.toUpperCase().replace(/[\s-]/g, "")
      : undefined;
    const newVehicle = await createVehicle(garageId, {
      customerId,
      brand: data.vehicle.brand ?? "",
      model: data.vehicle.model ?? "",
      licensePlate: licensePlate ?? "",
      year: data.vehicle.year,
    });
    vehicleId = newVehicle.id;
  }

  // 3. Ordre de réparation
  const ro = await createRepairOrder(garageId, userId, {
    customerId,
    vehicleId,
    mileageAtIntake: data.mileage,
    customerComplaint: data.service.description,
  });

  // 4. Ligne de l'OR (back-calcul TTC → HT avec TVA 20%)
  const vatRate = await getGarageVatRate(garageId);
  const unitPriceHt = data.amount ? data.amount / (1 + vatRate / 100) : 0;

  await addRepairOrderLine(garageId, {
    repairOrderId: ro.id,
    type: data.service.type,
    description: data.service.description,
    quantity: 1,
    unitPrice: unitPriceHt,
    vatRate,
    discountPercent: 0,
  });

  const result: QuickCaptureResult = {
    customerId,
    vehicleId,
    repairOrderId: ro.id,
    repairOrderNumber: ro.repairOrderNumber,
  };

  // 5. Facture + paiement (optionnel)
  if (data.createInvoice && data.amount && data.payment) {
    await closeRepairOrder(garageId, ro.id, userId);
    const invoice = await generateInvoiceFromRepairOrder(garageId, ro.id, userId);
    await finalizeInvoice(garageId, invoice.id);
    await recordPayment(garageId, {
      invoiceId: invoice.id,
      amount: data.amount,
      method: data.payment.method,
    });
    result.invoiceId = invoice.id;
    result.invoiceNumber = invoice.invoiceNumber;
  }

  return result;
}

async function getGarageVatRate(garageId: string): Promise<number> {
  const [garage] = await db.select().from(garages).where(eq(garages.id, garageId)).limit(1);
  return garage?.settings?.defaultVatRate ?? 20;
}
