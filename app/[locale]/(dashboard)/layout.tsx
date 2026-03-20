import { auth } from "@clerk/nextjs/server";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { UpsellBanner } from "@/components/billing/upsell-banner";
import { UpsellModal } from "@/components/billing/upsell-modal";
import { IdleTimeoutDialog } from "@/components/idle-timeout-dialog";
import { getUpsellState } from "@/app/[locale]/(dashboard)/billing/_actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only fetch upsell state when authenticated
  const { userId } = await auth();
  const upsell = userId ? await getUpsellState() : { show: false as const };

  return (
    <SidebarProvider className="overflow-hidden">
      <DashboardSidebar />
      <SidebarInset className="min-w-0">
        <DashboardHeader />
        <IdleTimeoutDialog />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {upsell.show && upsell.percentUsed >= 100 && (
            <UpsellModal
              quotaType={upsell.quotaType}
              nextPlanLimit={upsell.nextPlanLimit}
              nextPlan={upsell.nextPlan}
            />
          )}
          {upsell.show && upsell.percentUsed >= 80 && upsell.percentUsed < 100 && (
            <UpsellBanner
              quotaType={upsell.quotaType}
              percentUsed={upsell.percentUsed}
              currentLimit={upsell.currentLimit}
              nextPlanLimit={upsell.nextPlanLimit}
              nextPlan={upsell.nextPlan}
            />
          )}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
