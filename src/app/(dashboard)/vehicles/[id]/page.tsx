import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getVehicleById } from "@/server/services/vehicle.service";
import { getCustomerById } from "@/server/services/customer.service";
import { PageHeader } from "@/components/layouts/page-header";
import { VehicleDetail } from "./vehicle-detail";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VehiclePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const vehicle = await getVehicleById(session.user.garageId, id);
  if (!vehicle) notFound();

  const customer = await getCustomerById(session.user.garageId, vehicle.customerId);

  const title = [vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "Vehicule";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/customers/${vehicle.customerId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageHeader
          title={title}
          description={vehicle.licensePlate ?? undefined}
        />
      </div>
      <VehicleDetail
        vehicle={vehicle}
        customerName={
          customer
            ? [customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.companyName || "Client"
            : "Client inconnu"
        }
      />
    </div>
  );
}
