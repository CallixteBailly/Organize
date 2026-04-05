import { z } from "zod/v4";

export const notificationTypes = [
  "stock_low",
  "invoice_overdue",
  "invoice_paid",
  "quote_expired",
  "quote_accepted",
  "repair_order_completed",
  "repair_order_assigned",
  "customer_created",
  "customer_created_ai",
  "order_delivered",
  "payment_received",
  "user_action",
  "system",
] as const;

export const createNotificationSchema = z.object({
  type: z.enum(notificationTypes),
  title: z.string().min(1, "Le titre est requis").max(255),
  message: z.string().min(1, "Le message est requis"),
  link: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  userId: z.uuid().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
