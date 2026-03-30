import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrders } from "@/server/services/order.service";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { OrderList } from "./order-list";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Commandes" };

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function OrdersPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const ordersData = await getOrders(session.user.garageId, { page, limit: 20 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commandes"
        description={`${ordersData.total} commande(s)`}
        actions={
          <Link href="/orders/new">
            <Button>
              <Plus className="h-4 w-4" />
              Commande rapide
            </Button>
          </Link>
        }
      />
      <OrderList
        orders={ordersData.items}
        total={ordersData.total}
        page={ordersData.page}
        totalPages={ordersData.totalPages}
      />
    </div>
  );
}
