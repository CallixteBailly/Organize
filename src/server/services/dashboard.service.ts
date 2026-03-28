import { eq, and, sql, gte, lte, inArray, between } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices, repairOrders, stockItems, orders, customers } from "@/lib/db/schema";

export interface DashboardKPIs {
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  interventionsToday: number;
  interventionsInProgress: number;
  pendingInvoices: number;
  pendingInvoicesAmount: number;
  lowStockCount: number;
  pendingOrders: number;
  totalCustomers: number;
}

export async function getDashboardKPIs(garageId: string): Promise<DashboardKPIs> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const paidStatuses = ["paid", "partially_paid"] as const;
  const unpaidStatuses = ["finalized", "sent", "overdue"] as const;

  const [
    revToday,
    revWeek,
    revMonth,
    roToday,
    roInProgress,
    pendingInv,
    lowStock,
    pendingOrd,
    custCount,
  ] = await Promise.all([
    // Revenue today
    db
      .select({ total: sql<number>`coalesce(sum(${invoices.amountPaid}::numeric), 0)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.garageId, garageId),
          inArray(invoices.status, [...paidStatuses]),
          gte(invoices.issueDate, todayStart),
        ),
      ),
    // Revenue this week
    db
      .select({ total: sql<number>`coalesce(sum(${invoices.amountPaid}::numeric), 0)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.garageId, garageId),
          inArray(invoices.status, [...paidStatuses]),
          gte(invoices.issueDate, weekStart),
        ),
      ),
    // Revenue this month
    db
      .select({ total: sql<number>`coalesce(sum(${invoices.amountPaid}::numeric), 0)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.garageId, garageId),
          inArray(invoices.status, [...paidStatuses]),
          gte(invoices.issueDate, monthStart),
        ),
      ),
    // Interventions today
    db
      .select({ count: sql<number>`count(*)` })
      .from(repairOrders)
      .where(
        and(eq(repairOrders.garageId, garageId), gte(repairOrders.createdAt, todayStart)),
      ),
    // Interventions in progress
    db
      .select({ count: sql<number>`count(*)` })
      .from(repairOrders)
      .where(
        and(
          eq(repairOrders.garageId, garageId),
          inArray(repairOrders.status, ["draft", "pending", "approved", "in_progress"]),
        ),
      ),
    // Pending invoices (unpaid)
    db
      .select({
        count: sql<number>`count(*)`,
        total: sql<number>`coalesce(sum((${invoices.totalTtc}::numeric) - (${invoices.amountPaid}::numeric)), 0)`,
      })
      .from(invoices)
      .where(
        and(eq(invoices.garageId, garageId), inArray(invoices.status, [...unpaidStatuses])),
      ),
    // Low stock items
    db
      .select({ count: sql<number>`count(*)` })
      .from(stockItems)
      .where(
        and(
          eq(stockItems.garageId, garageId),
          eq(stockItems.isActive, true),
          lte(stockItems.quantity, stockItems.minQuantity),
        ),
      ),
    // Pending orders
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        and(
          eq(orders.garageId, garageId),
          inArray(orders.status, ["pending", "confirmed", "shipped"]),
        ),
      ),
    // Total customers
    db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(eq(customers.garageId, garageId)),
  ]);

  return {
    revenueToday: Number(revToday[0].total),
    revenueWeek: Number(revWeek[0].total),
    revenueMonth: Number(revMonth[0].total),
    interventionsToday: Number(roToday[0].count),
    interventionsInProgress: Number(roInProgress[0].count),
    pendingInvoices: Number(pendingInv[0].count),
    pendingInvoicesAmount: Number(pendingInv[0].total),
    lowStockCount: Number(lowStock[0].count),
    pendingOrders: Number(pendingOrd[0].count),
    totalCustomers: Number(custCount[0].count),
  };
}

// ── Revenue by day for chart ──

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export async function getRevenueByDay(
  garageId: string,
  startDate: Date,
  endDate: Date,
): Promise<RevenueDataPoint[]> {
  const result = await db
    .select({
      date: sql<string>`to_char(${invoices.issueDate}, 'YYYY-MM-DD')`,
      revenue: sql<number>`coalesce(sum(${invoices.amountPaid}::numeric), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.garageId, garageId),
        inArray(invoices.status, ["paid", "partially_paid"]),
        gte(invoices.issueDate, startDate),
        lte(invoices.issueDate, endDate),
      ),
    )
    .groupBy(sql`to_char(${invoices.issueDate}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${invoices.issueDate}, 'YYYY-MM-DD')`);

  return result.map((r: { date: string; revenue: number }) => ({ date: r.date, revenue: Number(r.revenue) }));
}

// ── N vs N-1 comparison ──

export interface PeriodComparison {
  currentPeriod: number;
  previousPeriod: number;
  changePercent: number;
}

export async function getRevenueComparison(
  garageId: string,
  period: "month" | "quarter" | "year",
): Promise<PeriodComparison> {
  const now = new Date();
  let currentStart: Date;
  let currentEnd: Date;
  let previousStart: Date;
  let previousEnd: Date;

  if (period === "month") {
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    previousStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    previousEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);
  } else if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    currentStart = new Date(now.getFullYear(), q * 3, 1);
    currentEnd = new Date(now.getFullYear(), (q + 1) * 3, 0);
    previousStart = new Date(now.getFullYear() - 1, q * 3, 1);
    previousEnd = new Date(now.getFullYear() - 1, (q + 1) * 3, 0);
  } else {
    currentStart = new Date(now.getFullYear(), 0, 1);
    currentEnd = new Date(now.getFullYear(), 11, 31);
    previousStart = new Date(now.getFullYear() - 1, 0, 1);
    previousEnd = new Date(now.getFullYear() - 1, 11, 31);
  }

  const paidStatuses = ["paid", "partially_paid"] as const;

  const [current, previous] = await Promise.all([
    db
      .select({ total: sql<number>`coalesce(sum(${invoices.amountPaid}::numeric), 0)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.garageId, garageId),
          inArray(invoices.status, [...paidStatuses]),
          between(invoices.issueDate, currentStart, currentEnd),
        ),
      ),
    db
      .select({ total: sql<number>`coalesce(sum(${invoices.amountPaid}::numeric), 0)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.garageId, garageId),
          inArray(invoices.status, [...paidStatuses]),
          between(invoices.issueDate, previousStart, previousEnd),
        ),
      ),
  ]);

  const currentTotal = Number(current[0].total);
  const previousTotal = Number(previous[0].total);
  const changePercent = previousTotal > 0
    ? ((currentTotal - previousTotal) / previousTotal) * 100
    : currentTotal > 0 ? 100 : 0;

  return {
    currentPeriod: currentTotal,
    previousPeriod: previousTotal,
    changePercent: Math.round(changePercent * 10) / 10,
  };
}

// ── Anomaly Alerts ──

export interface DashboardAlert {
  type: "stock" | "invoice" | "revenue";
  severity: "warning" | "critical";
  message: string;
  link: string;
}

export async function getDashboardAlerts(garageId: string): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = [];

  // Low stock
  const [lowStock] = await db
    .select({ count: sql<number>`count(*)` })
    .from(stockItems)
    .where(
      and(
        eq(stockItems.garageId, garageId),
        eq(stockItems.isActive, true),
        lte(stockItems.quantity, stockItems.minQuantity),
      ),
    );

  if (Number(lowStock.count) > 0) {
    alerts.push({
      type: "stock",
      severity: Number(lowStock.count) > 5 ? "critical" : "warning",
      message: `${lowStock.count} article(s) sous le seuil minimum`,
      link: "/stock/alerts",
    });
  }

  // Overdue invoices
  const now = new Date();
  const [overdue] = await db
    .select({
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum((${invoices.totalTtc}::numeric) - (${invoices.amountPaid}::numeric)), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.garageId, garageId),
        inArray(invoices.status, ["finalized", "sent", "overdue"]),
        lte(invoices.dueDate, now),
      ),
    );

  if (Number(overdue.count) > 0) {
    alerts.push({
      type: "invoice",
      severity: "critical",
      message: `${overdue.count} facture(s) en retard (${Number(overdue.total).toFixed(2)} EUR)`,
      link: "/invoices",
    });
  }

  return alerts;
}
