"use server";

import { auth } from "@/lib/auth";
import { hasPermission, type UserRole } from "@/lib/constants/roles";
import { getActivities, type GetActivitiesFilters } from "@/server/services/activity-log.service";
import { paginationSchema } from "@/server/validators/common";
import { activityFiltersSchema } from "@/server/validators/activity-log";

export async function getActivityLogsAction(params: {
  page?: number;
  limit?: number;
  entityType?: string;
  action?: string;
  source?: "user" | "ai";
  search?: string;
  userId?: string;
}) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role as UserRole, "activity:view")) {
    return { success: false as const, error: "Acces reserve aux gerants" };
  }

  const pagination = paginationSchema.parse({
    page: params.page ?? 1,
    limit: params.limit ?? 30,
  });

  const filters = activityFiltersSchema.parse({
    entityType: params.entityType,
    action: params.action,
    source: params.source,
    search: params.search,
    userId: params.userId,
  });

  const data = await getActivities(
    session.user.garageId,
    pagination,
    filters as GetActivitiesFilters,
  );

  return { success: true as const, data };
}
