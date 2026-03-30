import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import bcryptjs from "bcryptjs";
import * as schema from "../src/lib/db/schema";
import { sql as rawSql } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:54322/organize";

export default async function globalSetup() {
  const sql = postgres(DATABASE_URL);
  const db = drizzle(sql, { schema });

  // Clean all tables in correct order (respecting FKs)
  await db.execute(rawSql`TRUNCATE payments, invoice_lines, invoices, quote_lines, quotes, repair_order_lines, repair_orders, order_items, orders, supplier_catalog, suppliers, stock_movements, stock_items, stock_categories, vehicles, customers, users, garages, plate_identity CASCADE`);

  // Seed test garage
  const [garage] = await db
    .insert(schema.garages)
    .values({
      name: "Garage E2E Test",
      siret: "99988877766655",
      address: "1 rue du Test",
      city: "Testville",
      postalCode: "75000",
      phone: "0100000000",
      email: "e2e@garage-test.fr",
    })
    .returning();

  const passwordHash = await bcryptjs.hash("password123", 10);

  // Owner
  const [owner] = await db.insert(schema.users).values({
    garageId: garage.id,
    email: "owner@test.fr",
    passwordHash,
    firstName: "Paul",
    lastName: "Gerant",
    role: "owner",
  }).returning();

  // Mechanic
  await db.insert(schema.users).values({
    garageId: garage.id,
    email: "meca@test.fr",
    passwordHash,
    firstName: "Luc",
    lastName: "Meca",
    role: "mechanic",
  });

  // Secretary
  await db.insert(schema.users).values({
    garageId: garage.id,
    email: "secr@test.fr",
    passwordHash,
    firstName: "Anne",
    lastName: "Secr",
    role: "secretary",
  });

  // Customer
  const [customer] = await db
    .insert(schema.customers)
    .values({
      garageId: garage.id,
      type: "individual",
      firstName: "Claire",
      lastName: "Dupont",
      phone: "0611223344",
      email: "claire@example.fr",
      address: "10 avenue des Champs",
      city: "Paris",
      postalCode: "75008",
    })
    .returning();

  // Company customer
  await db.insert(schema.customers).values({
    garageId: garage.id,
    type: "company",
    companyName: "Transport Martin SARL",
    siret: "11122233344455",
    phone: "0155667788",
    email: "contact@transport-martin.fr",
    city: "Lyon",
    postalCode: "69001",
  });

  // Vehicle
  await db
    .insert(schema.vehicles)
    .values({
      garageId: garage.id,
      customerId: customer.id,
      licensePlate: "EE001AA",
      brand: "Peugeot",
      model: "308",
      year: 2022,
      engineType: "diesel",
      mileage: 32000,
      color: "Gris",
    });

  // Second vehicle
  await db.insert(schema.vehicles).values({
    garageId: garage.id,
    customerId: customer.id,
    licensePlate: "FF002BB",
    brand: "Citroen",
    model: "C3",
    year: 2019,
    engineType: "essence",
    mileage: 78000,
  });

  // Demo catalog vehicle (plate used by mock provider: Renault Clio IV 2018)
  const [vehicleClio] = await db
    .insert(schema.vehicles)
    .values({
      garageId: garage.id,
      customerId: customer.id,
      licensePlate: "FG533LT",
      brand: "Renault",
      model: "Clio",
      year: 2018,
      engineType: "essence",
      mileage: 45000,
    })
    .returning();

  // Repair order for catalog contextual flow tests
  await db.insert(schema.repairOrders).values({
    garageId: garage.id,
    customerId: customer.id,
    vehicleId: vehicleClio.id,
    repairOrderNumber: "OR-E2E-001",
    status: "in_progress",
    createdBy: owner.id,
    customerComplaint: "Bruit frein avant",
  });

  // Stock categories
  const [catMoteur] = await db
    .insert(schema.stockCategories)
    .values({ garageId: garage.id, name: "Moteur", color: "#2563eb" })
    .returning();
  const [catFreins] = await db
    .insert(schema.stockCategories)
    .values({ garageId: garage.id, name: "Freinage", color: "#dc2626" })
    .returning();
  await db
    .insert(schema.stockCategories)
    .values({ garageId: garage.id, name: "Electricite", color: "#f59e0b" });

  // Stock items
  await db.insert(schema.stockItems).values({
    garageId: garage.id,
    categoryId: catMoteur.id,
    reference: "FH-308",
    barcode: "3760099887766",
    name: "Filtre huile Peugeot 308",
    brand: "Mann",
    purchasePrice: "9.00",
    sellingPrice: "18.00",
    vatRate: "20.00",
    quantity: 15,
    minQuantity: 3,
    location: "A1",
  });

  await db.insert(schema.stockItems).values({
    garageId: garage.id,
    categoryId: catFreins.id,
    reference: "PF-AV-308",
    name: "Plaquettes frein AV 308",
    brand: "Brembo",
    purchasePrice: "28.00",
    sellingPrice: "52.00",
    vatRate: "20.00",
    quantity: 1,
    minQuantity: 4,
    location: "B2",
  });

  await db.insert(schema.stockItems).values({
    garageId: garage.id,
    categoryId: catMoteur.id,
    reference: "FA-308",
    name: "Filtre air Peugeot 308",
    brand: "Mann",
    purchasePrice: "12.00",
    sellingPrice: "22.00",
    vatRate: "20.00",
    quantity: 0,
    minQuantity: 2,
    location: "A2",
  });

  // Supplier
  await db.insert(schema.suppliers).values({
    garageId: garage.id,
    name: "Pieces Auto Pro",
    code: "PAP",
    email: "cmd@pap.fr",
    phone: "0145000001",
    deliveryDays: 1,
  });

  await db.insert(schema.suppliers).values({
    garageId: garage.id,
    name: "Auto Distribution",
    code: "AD",
    email: "cmd@ad.fr",
    deliveryDays: 3,
  });

  await sql.end();
}
