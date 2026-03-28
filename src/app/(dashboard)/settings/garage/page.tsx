import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGarage } from "@/server/services/garage.service";
import { PageHeader } from "@/components/layouts/page-header";
import { GarageSettingsForm } from "./garage-form";

export default async function GarageSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const garage = await getGarage(session.user.garageId);
  if (!garage) redirect("/");

  return (
    <div className="space-y-6">
      <PageHeader title="Profil du garage" description="Informations generales de votre garage" />
      <GarageSettingsForm garage={garage} />
    </div>
  );
}
