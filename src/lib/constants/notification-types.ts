import {
  Bell,
  Package,
  AlertTriangle,
  DollarSign,
  Clock,
  CheckCircle,
  Wrench,
  UserPlus,
  Bot,
  Truck,
  CreditCard,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import type { notificationTypes } from "@/server/validators/notification";

export type NotificationType = (typeof notificationTypes)[number];

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
  metadata?: Record<string, unknown> | null;
};

type NotificationTypeConfig = {
  emoji: string;
  icon: LucideIcon;
  variant: "default" | "secondary" | "success" | "warning" | "destructive";
};

export const notificationTypeConfig: Record<NotificationType, NotificationTypeConfig> = {
  stock_low: { emoji: "📦", icon: Package, variant: "warning" },
  invoice_overdue: { emoji: "⚠️", icon: AlertTriangle, variant: "destructive" },
  invoice_paid: { emoji: "💰", icon: DollarSign, variant: "success" },
  quote_expired: { emoji: "⏰", icon: Clock, variant: "warning" },
  quote_accepted: { emoji: "✅", icon: CheckCircle, variant: "success" },
  repair_order_completed: { emoji: "🔧", icon: Wrench, variant: "success" },
  repair_order_assigned: { emoji: "👤", icon: ClipboardList, variant: "default" },
  customer_created: { emoji: "👥", icon: UserPlus, variant: "default" },
  customer_created_ai: { emoji: "🤖", icon: Bot, variant: "secondary" },
  order_delivered: { emoji: "🚚", icon: Truck, variant: "success" },
  payment_received: { emoji: "💳", icon: CreditCard, variant: "success" },
  user_action: { emoji: "📋", icon: ClipboardList, variant: "default" },
  system: { emoji: "🔔", icon: Bell, variant: "secondary" },
};

export function getNotificationConfig(type: string): NotificationTypeConfig {
  return notificationTypeConfig[type as NotificationType] ?? notificationTypeConfig.system;
}
