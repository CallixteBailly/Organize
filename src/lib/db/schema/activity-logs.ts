import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { garages } from "./garages";
import { users } from "./users";
import { activityActionEnum, activitySourceEnum } from "./enums";

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    garageId: uuid("garage_id")
      .notNull()
      .references(() => garages.id, { onDelete: "cascade" }),
    // L'utilisateur qui a effectué ou confirmé l'action
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Source : action manuelle (user) ou suggestion IA confirmée (ai)
    source: activitySourceEnum("source").notNull().default("user"),
    // Type d'action
    action: activityActionEnum("action").notNull(),
    // Entité concernée (customer, vehicle, invoice, quote, repair_order, stock, order, supplier, user, garage, payment)
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    // ID de l'entité concernée
    entityId: uuid("entity_id"),
    // Description lisible de l'action (ex: "Création du client Jean Dupont")
    description: text("description").notNull(),
    // Métadonnées supplémentaires (ancien/nouveau statut, champs modifiés, etc.)
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    // Adresse IP (optionnel, pour audit)
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("activity_logs_garage_idx").on(table.garageId),
    index("activity_logs_user_idx").on(table.userId),
    index("activity_logs_entity_idx").on(table.entityType, table.entityId),
    index("activity_logs_date_idx").on(table.createdAt),
  ],
);
