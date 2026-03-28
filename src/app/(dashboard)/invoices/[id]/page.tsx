import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getInvoiceById } from "@/server/services/invoice.service";
import { PageHeader } from "@/components/layouts/page-header";
import { InvoiceDetail } from "./invoice-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const data = await getInvoiceById(session.user.garageId, id);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Facture ${data.invoice.invoiceNumber}`}
        description={data.invoice.customerName}
      />
      <InvoiceDetail data={data} userRole={session.user.role} />
    </div>
  );
}
