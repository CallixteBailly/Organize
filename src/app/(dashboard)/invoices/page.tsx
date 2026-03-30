import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInvoices } from "@/server/services/invoice.service";
import { PageHeader } from "@/components/layouts/page-header";
import { InvoiceList } from "./invoice-list";

export const metadata: Metadata = { title: "Factures" };

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function InvoicesPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const data = await getInvoices(session.user.garageId, { page, limit: 20 });

  return (
    <div className="space-y-6">
      <PageHeader title="Factures" description={`${data.total} facture(s)`} />
      <InvoiceList invoices={data.items} page={data.page} totalPages={data.totalPages} />
    </div>
  );
}
