import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { IdleTimeoutDialog } from "@/components/idle-timeout-dialog";

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: false },
  };
}

export default async function AdminRouteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  try {
    await requireAdmin();
  } catch {
    const dashboardPath = locale === "fr" ? "/fr/dashboard" : "/dashboard";
    redirect(`${dashboardPath}?error=access_denied`);
  }

  return (
    <SidebarProvider className="overflow-hidden">
      <AdminSidebar />
      <SidebarInset className="min-w-0">
        <AdminHeader />
        <IdleTimeoutDialog />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
