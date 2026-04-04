import { z } from "zod/v4";

export const activityFiltersSchema = z.object({
  entityType: z.string().optional(),
  action: z.string().optional(),
  source: z.enum(["user", "ai"]).optional(),
  search: z.string().optional(),
  userId: z.uuid().optional(),
});

export type ActivityFiltersInput = z.infer<typeof activityFiltersSchema>;
