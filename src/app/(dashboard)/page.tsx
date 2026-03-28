import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getDashboardKPIs,
  getRevenueByDay,
  getRevenueComparison,
  getDashboardAlerts,
} from "@/server/services/dashboard.service";
import { PageHeader } from "@/components/layouts/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { RevenueChart } from "@/components/modules/dashboard/revenue-chart";
import { ComparisonCard } from "@/components/modules/dashboard/comparison-card";
import { AlertList } from "@/components/modules/dashboard/alert-list";
import { Euro, Wrench, Package, FileText, ShoppingCart, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { hasPermission, type UserRole } from "@/lib/constants/roles";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "dashboard:view")) {
    redirect("/repair-orders");
  }

  const garageId = session.user.garageId;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [kpis, revenueData, monthComparison, alerts] = await Promise.all([
    getDashboardKPIs(garageId),
    getRevenueByDay(garageId, thirtyDaysAgo, new Date()),
    getRevenueComparison(garageId, "month"),
    getDashboardAlerts(garageId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Vue d'ensemble de votre activite" />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="CA du jour"
          value={formatCurrency(kpis.revenueToday)}
          icon={Euro}
        />
        <StatCard
          title="CA du mois"
          value={formatCurrency(kpis.revenueMonth)}
          icon={Euro}
        />
        <StatCard
          title="Interventions"
          value={String(kpis.interventionsInProgress)}
          icon={Wrench}
          description={`${kpis.interventionsToday} aujourd'hui`}
        />
        <StatCard
          title="Factures impayees"
          value={String(kpis.pendingInvoices)}
          icon={FileText}
          description={formatCurrency(kpis.pendingInvoicesAmount)}
        />
        <StatCard
          title="Alertes stock"
          value={String(kpis.lowStockCount)}
          icon={Package}
        />
        <StatCard
          title="Clients"
          value={String(kpis.totalCustomers)}
          icon={Users}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} title="CA des 30 derniers jours" />
        </div>
        <div className="space-y-4">
          <ComparisonCard
            title="CA mensuel vs N-1"
            currentValue={monthComparison.currentPeriod}
            previousValue={monthComparison.previousPeriod}
            changePercent={monthComparison.changePercent}
          />
          <AlertList alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
