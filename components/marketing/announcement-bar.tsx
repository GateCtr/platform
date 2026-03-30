import { getAnnouncement } from "@/lib/announcement";
import { AnnouncementBarClient } from "./announcement-bar-client";

export async function AnnouncementBar({ locale }: { locale: string }) {
  const config = await getAnnouncement();
  if (!config) return null;
  return <AnnouncementBarClient config={config} locale={locale} />;
}
