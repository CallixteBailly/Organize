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
  const useHistovec = process.env.CATALOG_PROVIDER === "histovec";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogue pièces"
        description={
          useHistovec
            ? "Identification via Histovec (ANTS) — plaque + carte grise requises"
            : "Recherche par immatriculation ou par marque / modèle"
        }
      />
      <CatalogShell
        initialPlate={params.plate}
        targetRepairOrderId={params.roId}
        useHistovec={useHistovec}
      />
    </div>
  );
}
