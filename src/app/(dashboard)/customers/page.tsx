import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCustomers, searchCustomers } from "@/server/services/customer.service";
import { PageHeader } from "@/components/layouts/page-header";
import { CustomerList } from "./customer-list";

export const metadata: Metadata = { title: "Clients" };

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function CustomersPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const query = params.q ?? "";
  const page = Number(params.page ?? "1");

  let customers;
  if (query) {
    const results = await searchCustomers(session.user.garageId, query);
    customers = { items: results, total: results.length, page: 1, limit: 20, totalPages: 1 };
  } else {
    customers = await getCustomers(session.user.garageId, { page, limit: 20 });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" description={`${customers.total} client(s)`} />
      <CustomerList
        customers={customers.items}
        total={customers.total}
        page={customers.page}
        totalPages={customers.totalPages}
        currentQuery={query}
      />
    </div>
  );
}
