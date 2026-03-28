import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getStockItemById, getMovementsByItem } from "@/server/services/stock.service";
import { PageHeader } from "@/components/layouts/page-header";
import { StockItemDetail } from "./stock-item-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StockItemPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const [item, movements] = await Promise.all([
    getStockItemById(session.user.garageId, id),
    getMovementsByItem(session.user.garageId, id, 30),
  ]);

  if (!item) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={item.name} description={`Ref: ${item.reference}`} />
      <StockItemDetail item={item} movements={movements} />
    </div>
  );
}
