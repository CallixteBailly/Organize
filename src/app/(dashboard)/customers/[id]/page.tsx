import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getCustomerWithVehicles, getCustomerStats } from "@/server/services/customer.service";
import { PageHeader } from "@/components/layouts/page-header";
import { CustomerDetail } from "./customer-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CustomerPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const [customer, stats] = await Promise.all([
    getCustomerWithVehicles(session.user.garageId, id),
    getCustomerStats(session.user.garageId, id),
  ]);

  if (!customer) notFound();

  const displayName =
    customer.type === "company" && customer.companyName
      ? customer.companyName
      : [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Client";

  return (
    <div className="space-y-6">
      <PageHeader title={displayName} description="Fiche client" />
      <CustomerDetail customer={customer} stats={stats} />
    </div>
  );
}
