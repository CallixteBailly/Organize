import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getNotifications } from "@/server/services/notification.service";
import { PageHeader } from "@/components/layouts/page-header";
import { NotificationList } from "./notification-list";

export const metadata = {
  title: "Notifications | Organize",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const data = await getNotifications(session.user.garageId, session.user.id, {
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${data.unreadCount} non lue${data.unreadCount > 1 ? "s" : ""}`}
      />
      <NotificationList
        notifications={data.items}
        total={data.total}
        unreadCount={data.unreadCount}
        page={page}
        limit={20}
      />
    </div>
  );
}
