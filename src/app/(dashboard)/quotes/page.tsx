import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getQuotes } from "@/server/services/quote.service";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { QuoteList } from "./quote-list";

export const metadata: Metadata = { title: "Devis" };

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function QuotesPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const data = await getQuotes(session.user.garageId, { page, limit: 20 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devis"
        description={`${data.total} devis`}
        actions={
          <Link href="/quotes/new">
            <Button><Plus className="h-4 w-4" /> Nouveau devis</Button>
          </Link>
        }
      />
      <QuoteList quotes={data.items} page={data.page} totalPages={data.totalPages} />
    </div>
  );
}
