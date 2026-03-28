import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUsersByGarage } from "@/server/services/user.service";
import { PageHeader } from "@/components/layouts/page-header";
import { UsersList } from "./users-list";

export default async function UsersSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["owner", "manager"].includes(session.user.role)) redirect("/");

  const usersList = await getUsersByGarage(session.user.garageId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        description="Gerez les membres de votre equipe et leurs roles"
      />
      <UsersList users={usersList} currentUserId={session.user.id} />
    </div>
  );
}
