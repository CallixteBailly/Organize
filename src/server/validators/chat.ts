import { z } from "zod/v4";
import { AI_CHAT } from "@/lib/constants/ai";

export const pageContextSchema = z.object({
  route: z.string().max(200),
  entityType: z
    .enum(["repair_order", "customer", "vehicle", "quote", "invoice", "stock_item"])
    .optional(),
  entityId: z.uuid().optional(),
});

export const chatMessageSchema = z.object({
  role: z.enum(["human", "assistant"]),
  content: z.string().min(1).max(AI_CHAT.maxMessageLength),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(AI_CHAT.maxHistory),
  pageContext: pageContextSchema.optional(),
  confirmedPlan: z.boolean().optional(),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
