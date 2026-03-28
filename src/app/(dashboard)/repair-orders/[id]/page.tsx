import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getRepairOrderById } from "@/server/services/repair-order.service";
import { PageHeader } from "@/components/layouts/page-header";
import { RepairOrderDetail } from "./repair-order-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RepairOrderPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const data = await getRepairOrderById(session.user.garageId, id);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`OR ${data.repairOrder.repairOrderNumber}`}
        description={`${data.customerFirstName ?? ""} ${data.customerLastName ?? data.customerCompanyName ?? ""} — ${data.vehicleBrand} ${data.vehicleModel}`}
      />
      <RepairOrderDetail data={data} />
    </div>
  );
}
