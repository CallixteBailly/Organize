import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import bcryptjs from "bcryptjs";
import * as schema from "../src/lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:54322/organize";

async function seed() {
  const sql = postgres(DATABASE_URL);
  const db = drizzle(sql, { schema });

  console.log("Seeding database...");

  // Create garage
  const [garage] = await db
    .insert(schema.garages)
    .values({
      name: "Garage Martin Test",
      siret: "12345678901234",
      address: "12 rue de la Paix",
      city: "Paris",
      postalCode: "75001",
      phone: "0145678900",
      email: "contact@garage-martin.fr",
    })
    .returning();

  console.log(`Garage created: ${garage.name} (${garage.id})`);

  // Create owner user
  const passwordHash = await bcryptjs.hash("password123", 12);
  const [owner] = await db
    .insert(schema.users)
    .values({
      garageId: garage.id,
      email: "admin@garage-martin.fr",
      passwordHash,
      firstName: "Jean",
      lastName: "Martin",
      role: "owner",
    })
    .returning();

  console.log(`Owner created: ${owner.email}`);

  // Create mechanic
  const [mechanic] = await db
    .insert(schema.users)
    .values({
      garageId: garage.id,
      email: "meca@garage-martin.fr",
      passwordHash,
      firstName: "Pierre",
      lastName: "Dupont",
      role: "mechanic",
    })
    .returning();

  console.log(`Mechanic created: ${mechanic.email}`);

  // Create customer
  const [customer] = await db
    .insert(schema.customers)
    .values({
      garageId: garage.id,
      type: "individual",
      firstName: "Marie",
      lastName: "Durand",
      phone: "0612345678",
      email: "marie@example.fr",
      address: "5 avenue Victor Hugo",
      city: "Paris",
      postalCode: "75016",
    })
    .returning();

  console.log(`Customer created: ${customer.firstName} ${customer.lastName}`);

  // Create vehicle
  const [vehicle] = await db
    .insert(schema.vehicles)
    .values({
      garageId: garage.id,
      customerId: customer.id,
      licensePlate: "AB123CD",
      brand: "Renault",
      model: "Clio V",
      year: 2021,
      engineType: "essence",
      mileage: 45000,
      color: "Blanc",
    })
    .returning();

  console.log(`Vehicle created: ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`);

  // Create stock categories
  const [catFilters] = await db
    .insert(schema.stockCategories)
    .values({ garageId: garage.id, name: "Filtres", color: "#3b82f6" })
    .returning();

  const [catFreinage] = await db
    .insert(schema.stockCategories)
    .values({ garageId: garage.id, name: "Freinage", color: "#ef4444" })
    .returning();

  console.log("Categories created: Filtres, Freinage");

  // Create stock items
  const [itemFiltre] = await db
    .insert(schema.stockItems)
    .values({
      garageId: garage.id,
      categoryId: catFilters.id,
      reference: "FH-001",
      barcode: "3760001234567",
      name: "Filtre a huile Renault",
      brand: "Mann",
      purchasePrice: "8.50",
      sellingPrice: "15.00",
      vatRate: "20.00",
      quantity: 12,
      minQuantity: 3,
      location: "Etagere A1",
    })
    .returning();

  await db.insert(schema.stockItems).values({
    garageId: garage.id,
    categoryId: catFreinage.id,
    reference: "PF-001",
    name: "Plaquettes frein AV Clio",
    brand: "Brembo",
    purchasePrice: "25.00",
    sellingPrice: "45.00",
    vatRate: "20.00",
    quantity: 2,
    minQuantity: 4,
    location: "Etagere B2",
  });

  console.log("Stock items created: Filtre a huile, Plaquettes frein (low stock!)");

  // Create supplier
  const [supplier] = await db
    .insert(schema.suppliers)
    .values({
      garageId: garage.id,
      name: "Auto Pieces Express",
      code: "APE",
      email: "commandes@ape.fr",
      phone: "0145000000",
      deliveryDays: 2,
    })
    .returning();

  console.log(`Supplier created: ${supplier.name}`);

  console.log("\n--- Seed complete ---");
  console.log("Login: admin@garage-martin.fr / password123");
  console.log("Mechanic: meca@garage-martin.fr / password123");

  await sql.end();
}

seed().catch(console.error);
