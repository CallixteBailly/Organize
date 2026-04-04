import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission, type UserRole } from "@/lib/constants/roles";
import { PageHeader } from "@/components/layouts/page-header";
import { ActivityFeed } from "./activity-feed";

export const metadata: Metadata = { title: "Journal d'activite" };

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "dashboard:view")) {
    redirect("/repair-orders");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal d'activite"
        description="Historique de toutes les actions effectuees"
      />
      <ActivityFeed />
    </div>
  );
}
