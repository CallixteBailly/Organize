"use server";

import { auth } from "@/lib/auth";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  checkAndNotifyLowStock,
} from "@/server/services/notification.service";
import { revalidatePath } from "next/cache";

export type NotificationActionState = {
  success: boolean;
  error?: string;
};

export async function getNotificationsAction(page = 1, limit = 20) {
  const session = await auth();
  if (!session?.user) return { items: [], total: 0, unreadCount: 0, page: 1, limit: 20 };

  return getNotifications(session.user.garageId, session.user.id, { page, limit });
}

export async function getUnreadCountAction() {
  const session = await auth();
  if (!session?.user) return 0;

  return getUnreadCount(session.user.garageId, session.user.id);
}

export async function markAsReadAction(
  _prevState: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const notificationId = formData.get("notificationId") as string;
  if (!notificationId) return { success: false, error: "Notification non specifiee" };

  try {
    await markAsRead(session.user.garageId, session.user.id, notificationId);
    revalidatePath("/notifications");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du marquage" };
  }
}

export async function markAllAsReadAction(): Promise<NotificationActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  try {
    await markAllAsRead(session.user.garageId, session.user.id);
    revalidatePath("/notifications");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du marquage" };
  }
}

export async function deleteNotificationAction(
  _prevState: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const notificationId = formData.get("notificationId") as string;
  if (!notificationId) return { success: false, error: "Notification non specifiee" };

  try {
    await deleteNotification(session.user.garageId, notificationId);
    revalidatePath("/notifications");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression" };
  }
}

export async function checkLowStockAction(): Promise<NotificationActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  if (!["owner", "manager"].includes(session.user.role)) {
    return { success: false, error: "Permission refusee" };
  }

  try {
    await checkAndNotifyLowStock(session.user.garageId);
    revalidatePath("/notifications");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la verification du stock" };
  }
}
