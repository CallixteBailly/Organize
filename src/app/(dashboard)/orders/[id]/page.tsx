import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getOrderById } from "@/server/services/order.service";
import { PageHeader } from "@/components/layouts/page-header";
import { OrderDetail } from "./order-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const order = await getOrderById(session.user.garageId, id);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Commande ${order.order.orderNumber}`}
        description={`Fournisseur: ${order.supplierName}`}
      />
      <OrderDetail order={order} />
    </div>
  );
}
