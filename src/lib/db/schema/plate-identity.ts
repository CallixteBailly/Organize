import { pgTable, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Table globale d'identification véhicule par plaque.
 *
 * - Pas de garageId ni de customerId : une plaque est unique nationalement.
 * - Alimentée automatiquement par L'Argus (ou autre provider) lors d'une recherche.
 * - Sert de cache permanent pour éviter de rappeler L'Argus à chaque fois.
 * - Les données ici sont techniques (véhicule), pas personnelles (pas de nom/contact).
 *
 * RGPD : base légale = intérêt légitime professionnel.
 * La plaque est un identifiant véhicule public ; les champs ne contiennent
 * aucune donnée sur le titulaire (nom, adresse…).
 */
export const plateIdentity = pgTable(
  "plate_identity",
  {
    plate: varchar("plate", { length: 20 }).primaryKey(), // Normalisée : uppercase, sans tirets
    make: varchar("make", { length: 100 }),
    model: varchar("model", { length: 100 }),
    year: integer("year"),
    fuelType: varchar("fuel_type", { length: 50 }),
    engineCode: varchar("engine_code", { length: 100 }),
    displacement: integer("displacement"),
    kTypeId: integer("k_type_id"),
    provider: varchar("provider", { length: 20 }).notNull().default("largus"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("plate_identity_make_idx").on(table.make),
    index("plate_identity_ktypeid_idx").on(table.kTypeId),
  ],
);

export type PlateIdentityRow = typeof plateIdentity.$inferSelect;
export type PlateIdentityInsert = typeof plateIdentity.$inferInsert;
