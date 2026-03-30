import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AnnouncementForm } from "@/components/admin/announcement/announcement-form";

export const metadata: Metadata = {
  title: "Announcement Bar — Admin",
};

async function getAnnouncementFlag() {
  return prisma.featureFlag.findUnique({
    where: { key: "announcement_bar" },
    select: { id: true, enabled: true, description: true },
  });
}

export default async function AnnouncementPage() {
  try {
    await requirePermission("system:read");
  } catch {
    redirect("/admin/overview");
  }

  const flag = await getAnnouncementFlag();

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Announcement Bar
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage the top banner displayed on all marketing pages.
        </p>
      </div>
      <AnnouncementForm flag={flag} />
    </div>
  );
}
