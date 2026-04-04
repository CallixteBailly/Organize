"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Trash2,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  markAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
} from "@/server/actions/notifications";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
  metadata: Record<string, unknown> | null;
};

const typeConfig: Record<string, { icon: typeof Bell; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  stock_low: { icon: Package, variant: "warning" },
  invoice_overdue: { icon: AlertTriangle, variant: "destructive" },
  invoice_paid: { icon: DollarSign, variant: "success" },
  quote_expired: { icon: Clock, variant: "warning" },
  quote_accepted: { icon: CheckCircle, variant: "success" },
  repair_order_completed: { icon: Wrench, variant: "success" },
  repair_order_assigned: { icon: ClipboardList, variant: "default" },
  customer_created: { icon: UserPlus, variant: "default" },
  customer_created_ai: { icon: Bot, variant: "secondary" },
  order_delivered: { icon: Truck, variant: "success" },
  payment_received: { icon: CreditCard, variant: "success" },
  user_action: { icon: ClipboardList, variant: "default" },
  system: { icon: Bell, variant: "secondary" },
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationList({
  notifications,
  total,
  unreadCount,
  page,
  limit,
}: {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const totalPages = Math.ceil(total / limit);

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllAsReadAction();
      router.refresh();
    });
  };

  const handleMarkRead = (notificationId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("notificationId", notificationId);
      await markAsReadAction({ success: false }, formData);
      router.refresh();
    });
  };

  const handleDelete = (notificationId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("notificationId", notificationId);
      await deleteNotificationAction({ success: false }, formData);
      router.refresh();
    });
  };

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="Aucune notification"
        description="Vous n'avez aucune notification pour le moment. Les alertes de stock, les mises a jour d'interventions et les actions importantes apparaitront ici."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" />
            Tout marquer comme lu
          </Button>
        </div>
      )}

      {/* Notifications */}
      <div className="space-y-2">
        {notifications.map((notif) => {
          const config = typeConfig[notif.type] || typeConfig.system;
          const Icon = config.icon;

          return (
            <Card
              key={notif.id}
              className={`transition-colors ${!notif.isRead ? "border-primary/30 bg-primary/5" : ""}`}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div
                  className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                    !notif.isRead ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${!notif.isRead ? "text-primary" : "text-muted-foreground"}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${!notif.isRead ? "font-semibold" : "font-medium"} text-foreground`}>
                          {notif.title}
                        </p>
                        <Badge variant={config.variant} className="text-[10px]">
                          {notif.type.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{notif.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(notif.createdAt)}</p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    {notif.link && (
                      <Link
                        href={notif.link}
                        className="inline-flex h-7 items-center rounded-[var(--radius)] border border-border px-2.5 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        Voir le detail
                      </Link>
                    )}
                    {!notif.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleMarkRead(notif.id)}
                        disabled={isPending}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Marquer comme lu
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleDelete(notif.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Supprimer
                    </Button>
                  </div>
                </div>

                {!notif.isRead && (
                  <div className="mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages} ({total} notification{total > 1 ? "s" : ""})
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => router.push(`/notifications?page=${page - 1}`)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Precedent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => router.push(`/notifications?page=${page + 1}`)}
            >
              Suivant
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
