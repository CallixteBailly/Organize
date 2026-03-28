import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSuppliers } from "@/server/services/supplier.service";
import { PageHeader } from "@/components/layouts/page-header";
import { SupplierManager } from "./supplier-manager";

export default async function SuppliersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["owner", "manager"].includes(session.user.role)) redirect("/");

  const supplierList = await getSuppliers(session.user.garageId);

  return (
    <div className="space-y-6">
      <PageHeader title="Fournisseurs" description="Gerez vos fournisseurs de pieces" />
      <SupplierManager suppliers={supplierList} />
    </div>
  );
}
