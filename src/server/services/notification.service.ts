import { eq, and, desc, sql, lte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, stockItems } from "@/lib/db/schema";
import type { CreateNotificationInput } from "@/server/validators/notification";
import type { PaginationInput } from "@/server/validators/common";

// ── CRUD ──

export async function getNotifications(
  garageId: string,
  userId: string,
  pagination: PaginationInput,
) {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  const where = and(
    eq(notifications.garageId, garageId),
    // Show notifications targeted to this user OR broadcast (userId = null)
    sql`(${notifications.userId} = ${userId} OR ${notifications.userId} IS NULL)`,
  );

  const [items, countResult, unreadResult] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(where),
    db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(where, eq(notifications.isRead, false))),
  ]);

  return {
    items,
    total: Number(countResult[0].count),
    unreadCount: Number(unreadResult[0].count),
    page,
    limit,
  };
}

export async function getUnreadCount(garageId: string, userId: string): Promise<number> {
  const where = and(
    eq(notifications.garageId, garageId),
    sql`(${notifications.userId} = ${userId} OR ${notifications.userId} IS NULL)`,
    eq(notifications.isRead, false),
  );

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(where);

  return Number(result.count);
}

export async function markAsRead(garageId: string, userId: string, notificationId: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.garageId, garageId),
        sql`(${notifications.userId} = ${userId} OR ${notifications.userId} IS NULL)`,
      ),
    );
}

export async function markAllAsRead(garageId: string, userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.garageId, garageId),
        sql`(${notifications.userId} = ${userId} OR ${notifications.userId} IS NULL)`,
        eq(notifications.isRead, false),
      ),
    );
}

export async function deleteNotification(garageId: string, notificationId: string) {
  await db
    .delete(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.garageId, garageId)));
}

// ── Create Notification (internal) ──

export async function createNotification(garageId: string, data: CreateNotificationInput, createdBy?: string) {
  const [notification] = await db
    .insert(notifications)
    .values({
      garageId,
      userId: data.userId ?? null,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link ?? null,
      metadata: data.metadata ?? null,
      createdBy: createdBy ?? null,
    })
    .returning();

  return notification;
}

// ── Trigger Helpers (called from other services) ──

export async function notifyStockLow(
  garageId: string,
  item: { id: string; name: string; reference: string; quantity: number; minQuantity: number },
) {
  return createNotification(garageId, {
    type: "stock_low",
    title: "Stock bas",
    message: `${item.name} (${item.reference}) : ${item.quantity} restant(s), seuil minimum : ${item.minQuantity}`,
    link: `/stock`,
    metadata: { stockItemId: item.id, quantity: item.quantity, minQuantity: item.minQuantity },
  });
}

export async function notifyInvoiceOverdue(
  garageId: string,
  invoice: { id: string; invoiceNumber: string; customerName: string; totalTtc: string },
) {
  return createNotification(garageId, {
    type: "invoice_overdue",
    title: "Facture en retard",
    message: `La facture ${invoice.invoiceNumber} de ${invoice.customerName} (${invoice.totalTtc} €) est en retard de paiement`,
    link: `/invoices/${invoice.id}`,
    metadata: { invoiceId: invoice.id },
  });
}

export async function notifyInvoicePaid(
  garageId: string,
  invoice: { id: string; invoiceNumber: string; customerName: string },
  userId?: string,
) {
  return createNotification(garageId, {
    type: "invoice_paid",
    title: "Facture payee",
    message: `La facture ${invoice.invoiceNumber} de ${invoice.customerName} a ete reglee`,
    link: `/invoices/${invoice.id}`,
    metadata: { invoiceId: invoice.id },
  }, userId);
}

export async function notifyQuoteExpired(
  garageId: string,
  quote: { id: string; quoteNumber: string; customerName: string },
) {
  return createNotification(garageId, {
    type: "quote_expired",
    title: "Devis expire",
    message: `Le devis ${quote.quoteNumber} pour ${quote.customerName} a expire`,
    link: `/quotes/${quote.id}`,
    metadata: { quoteId: quote.id },
  });
}

export async function notifyQuoteAccepted(
  garageId: string,
  quote: { id: string; quoteNumber: string; customerName: string },
  userId?: string,
) {
  return createNotification(garageId, {
    type: "quote_accepted",
    title: "Devis accepte",
    message: `Le devis ${quote.quoteNumber} de ${quote.customerName} a ete accepte`,
    link: `/quotes/${quote.id}`,
    metadata: { quoteId: quote.id },
  }, userId);
}

export async function notifyRepairOrderCompleted(
  garageId: string,
  ro: { id: string; repairOrderNumber: string },
  userId?: string,
) {
  return createNotification(garageId, {
    type: "repair_order_completed",
    title: "Intervention terminee",
    message: `L'intervention ${ro.repairOrderNumber} est terminee`,
    link: `/repair-orders/${ro.id}`,
    metadata: { repairOrderId: ro.id },
  }, userId);
}

export async function notifyRepairOrderAssigned(
  garageId: string,
  ro: { id: string; repairOrderNumber: string },
  assignedToUserId: string,
  assignedByUserId?: string,
) {
  return createNotification(garageId, {
    type: "repair_order_assigned",
    title: "Intervention assignee",
    message: `L'intervention ${ro.repairOrderNumber} vous a ete assignee`,
    link: `/repair-orders/${ro.id}`,
    metadata: { repairOrderId: ro.id },
    userId: assignedToUserId,
  }, assignedByUserId);
}

export async function notifyCustomerCreated(
  garageId: string,
  customer: { id: string; firstName: string; lastName: string },
  userId?: string,
) {
  return createNotification(garageId, {
    type: "customer_created",
    title: "Nouveau client",
    message: `Le client ${customer.firstName} ${customer.lastName} a ete cree`,
    link: `/customers/${customer.id}`,
    metadata: { customerId: customer.id },
  }, userId);
}

export async function notifyCustomerCreatedByAI(
  garageId: string,
  customer: { id: string; firstName: string; lastName: string; companyName?: string | null },
  userId?: string,
) {
  const name = customer.companyName || `${customer.firstName} ${customer.lastName}`;
  return createNotification(garageId, {
    type: "customer_created_ai",
    title: "Client cree par l'IA",
    message: `L'IA a cree le client "${name}" via la capture rapide`,
    link: `/customers/${customer.id}`,
    metadata: { customerId: customer.id, source: "quick-capture" },
  }, userId);
}

export async function notifyOrderDelivered(
  garageId: string,
  order: { id: string; orderNumber: string; supplierName: string },
  userId?: string,
) {
  return createNotification(garageId, {
    type: "order_delivered",
    title: "Commande livree",
    message: `La commande ${order.orderNumber} du fournisseur ${order.supplierName} a ete livree`,
    link: `/orders/${order.id}`,
    metadata: { orderId: order.id },
  }, userId);
}

export async function notifyPaymentReceived(
  garageId: string,
  payment: { invoiceNumber: string; invoiceId: string; amount: number; method: string },
  userId?: string,
) {
  return createNotification(garageId, {
    type: "payment_received",
    title: "Paiement recu",
    message: `Paiement de ${payment.amount} € recu pour la facture ${payment.invoiceNumber} (${payment.method})`,
    link: `/invoices/${payment.invoiceId}`,
    metadata: { invoiceId: payment.invoiceId, amount: payment.amount },
  }, userId);
}

// ── Batch: Check low stock for entire garage ──

export async function checkAndNotifyLowStock(garageId: string) {
  const lowStockItems = await db
    .select()
    .from(stockItems)
    .where(
      and(
        eq(stockItems.garageId, garageId),
        eq(stockItems.isActive, true),
        lte(stockItems.quantity, stockItems.minQuantity),
      ),
    );

  const created = [];
  for (const item of lowStockItems) {
    const notif = await notifyStockLow(garageId, {
      id: item.id,
      name: item.name,
      reference: item.reference,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
    });
    created.push(notif);
  }

  return created;
}
