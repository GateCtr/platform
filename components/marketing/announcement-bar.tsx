import { getAnnouncement } from "@/lib/announcement";
import { AnnouncementBarClient } from "./announcement-bar-client";
import { unstable_noStore as noStore } from "next/cache";

export async function AnnouncementBar({ locale }: { locale: string }) {
  noStore();
  const config = await getAnnouncement();
  if (!config) return null;
  return <AnnouncementBarClient config={config} locale={locale} />;
}
