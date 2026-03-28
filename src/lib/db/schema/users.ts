import { pgTable, uuid, varchar, text, timestamp, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { garages } from "./garages";
import { userRoleEnum } from "./enums";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    garageId: uuid("garage_id")
      .notNull()
      .references(() => garages.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash"),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    role: userRoleEnum("role").notNull().default("mechanic"),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_garage_idx").on(table.email, table.garageId),
    index("users_garage_idx").on(table.garageId),
  ],
);
