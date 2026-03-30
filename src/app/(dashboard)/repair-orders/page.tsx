import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRepairOrders } from "@/server/services/repair-order.service";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { RepairOrderList } from "./repair-order-list";

export const metadata: Metadata = { title: "Ordres de reparation" };

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function RepairOrdersPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const data = await getRepairOrders(session.user.garageId, { page, limit: 20 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interventions"
        description={`${data.total} ordre(s) de reparation`}
        actions={
          <Link href="/repair-orders/new">
            <Button><Plus className="h-4 w-4" /> Nouvel OR</Button>
          </Link>
        }
      />
      <RepairOrderList orders={data.items} page={data.page} totalPages={data.totalPages} />
    </div>
  );
}
