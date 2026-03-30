import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStockItems, getCategories } from "@/server/services/stock.service";
import { PageHeader } from "@/components/layouts/page-header";
import { StockList } from "./stock-list";

export const metadata: Metadata = { title: "Stock" };

interface Props {
  searchParams: Promise<{ q?: string; page?: string; category?: string; lowStock?: string }>;
}

export default async function StockPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const page = Number(params.page ?? "1");

  const [stockData, categories] = await Promise.all([
    getStockItems(session.user.garageId, { page, limit: 20 }, {
      search: params.q,
      categoryId: params.category,
      lowStockOnly: params.lowStock === "true",
    }),
    getCategories(session.user.garageId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Stock" description={`${stockData.total} article(s)`} />
      <StockList
        items={stockData.items}
        categories={categories}
        total={stockData.total}
        page={stockData.page}
        totalPages={stockData.totalPages}
        currentQuery={params.q ?? ""}
        currentCategory={params.category ?? ""}
        lowStockOnly={params.lowStock === "true"}
      />
    </div>
  );
}
