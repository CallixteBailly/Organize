import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layouts/page-header";
import { CatalogShell } from "./catalog-shell";

interface Props {
  searchParams: Promise<{ plate?: string; roId?: string }>;
}

export default async function CatalogPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogue pièces"
        description="Recherche par immatriculation — pièces compatibles par catégorie"
      />
      <CatalogShell
        initialPlate={params.plate}
        targetRepairOrderId={params.roId}
      />
    </div>
  );
}
