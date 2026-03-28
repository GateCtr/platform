import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NotificationsClient } from "./_components/notifications-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "adminNotifications.metadata",
  });
  return { title: t("title") };
}

export default function AdminNotificationsPage() {
  return <NotificationsClient />;
}
