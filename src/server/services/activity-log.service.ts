import { eq, and, desc, sql, ilike, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLogs, users } from "@/lib/db/schema";
import type { PaginationInput } from "@/server/validators/common";

export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "finalize"
  | "send"
  | "payment"
  | "convert"
  | "close"
  | "sign"
  | "login";

export type ActivitySource = "user" | "ai";

export type EntityType =
  | "customer"
  | "vehicle"
  | "invoice"
  | "quote"
  | "repair_order"
  | "stock"
  | "order"
  | "supplier"
  | "user"
  | "garage"
  | "payment"
  | "stock_category";

export interface LogActivityInput {
  garageId: string;
  userId: string;
  source?: ActivitySource;
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Enregistre une activité dans le journal.
 * Cette fonction ne lance jamais d'erreur — les échecs de logging
 * ne doivent pas bloquer l'action principale.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await db.insert(activityLogs).values({
      garageId: input.garageId,
      userId: input.userId,
      source: input.source ?? "user",
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      description: input.description,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
    });
  } catch (error) {
    console.error("[activity-log] Erreur enregistrement:", error);
  }
}

export interface GetActivitiesFilters {
  entityType?: string;
  action?: string;
  source?: ActivitySource;
  search?: string;
  userId?: string;
}

export async function getActivities(
  garageId: string,
  pagination: PaginationInput,
  filters?: GetActivitiesFilters,
) {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(activityLogs.garageId, garageId)];

  if (filters?.entityType) {
    conditions.push(eq(activityLogs.entityType, filters.entityType));
  }
  if (filters?.action) {
    conditions.push(eq(activityLogs.action, filters.action as ActivityAction));
  }
  if (filters?.source) {
    conditions.push(eq(activityLogs.source, filters.source));
  }
  if (filters?.userId) {
    conditions.push(eq(activityLogs.userId, filters.userId));
  }
  if (filters?.search) {
    conditions.push(ilike(activityLogs.description, `%${filters.search}%`));
  }

  const whereClause = and(...conditions);

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        source: activityLogs.source,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        description: activityLogs.description,
        metadata: activityLogs.metadata,
        createdAt: activityLogs.createdAt,
        userName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        userRole: users.role,
      })
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs)
      .where(whereClause),
  ]);

  return {
    items,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}
