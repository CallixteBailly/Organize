import type { UserRole } from "@/lib/constants/roles";

export interface ToolContext {
  garageId: string;
  userId: string;
  role: UserRole;
}

export interface PageContext {
  route: string;
  entityType?: "repair_order" | "customer" | "vehicle" | "quote" | "invoice" | "stock_item";
  entityId?: string;
}

export interface ChatMessage {
  role: "human" | "assistant";
  content: string;
  links?: NavigationLink[];
  pendingPlan?: string;
}

export interface NavigationLink {
  href: string;
  label: string;
}

export interface AgentResult {
  reply: string;
  links: NavigationLink[];
  pendingPlan?: string;
}
