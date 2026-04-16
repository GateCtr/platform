import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { InboxDashboard } from "@/components/dashboard/inbox/inbox-dashboard";

export default async function AdminInboxPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/overview");
  }

  return <InboxDashboard />;
}
