import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCategories } from "@/server/services/stock.service";
import { PageHeader } from "@/components/layouts/page-header";
import { CategoryManager } from "./category-manager";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const categories = await getCategories(session.user.garageId);

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Gerez les categories de votre stock" />
      <CategoryManager categories={categories} />
    </div>
  );
}
