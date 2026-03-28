import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getQuoteById } from "@/server/services/quote.service";
import { PageHeader } from "@/components/layouts/page-header";
import { QuoteDetail } from "./quote-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuotePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const data = await getQuoteById(session.user.garageId, id);
  if (!data) notFound();

  const customerName = data.customerCompanyName
    || [data.customerFirstName, data.customerLastName].filter(Boolean).join(" ")
    || "Client";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Devis ${data.quote.quoteNumber}`}
        description={customerName}
      />
      <QuoteDetail data={data} />
    </div>
  );
}
