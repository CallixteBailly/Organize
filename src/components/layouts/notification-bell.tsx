"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getNotificationsAction,
  getUnreadCountAction,
  markAllAsReadAction,
} from "@/server/actions/notifications";
import { getNotificationConfig, type NotificationItem } from "@/lib/constants/notification-types";
import { formatRelativeTime } from "@/lib/utils/format";
import Link from "next/link";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isPending, startTransition] = useTransition();

  const fetchUnreadCount = useCallback(() => {
    startTransition(async () => {
      const count = await getUnreadCountAction();
      setUnreadCount(count);
    });
  }, []);

  const fetchNotifications = useCallback(() => {
    startTransition(async () => {
      const result = await getNotificationsAction(1, 10);
      setItems(result.items as NotificationItem[]);
      setUnreadCount(result.unreadCount);
    });
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllAsReadAction();
      setUnreadCount(0);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    });
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-[var(--shadow-lg)] sm:w-96">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="h-7 text-xs"
                  disabled={isPending}
                >
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Tout lire
                </Button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Aucune notification
                </div>
              ) : (
                items.map((notif) => (
                  <div
                    key={notif.id}
                    className={`border-b border-border/50 px-4 py-3 transition-colors last:border-0 ${
                      notif.isRead ? "opacity-60" : "bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-base" aria-hidden="true">
                        {getNotificationConfig(notif.type).emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{notif.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {notif.message}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                          {notif.link && (
                            <Link
                              href={notif.link}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-0.5 text-[10px] font-medium text-primary hover:underline"
                            >
                              Voir <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                      {!notif.isRead && (
                        <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border px-4 py-2">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-xs font-medium text-primary hover:underline"
              >
                Voir toutes les notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
