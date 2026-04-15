import { Suspense } from "react";
import { Mail } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getEmailRecipients } from "./_actions";
import { MassEmailClient } from "@/components/admin/mass-email/mass-email-client";
import { CampaignStatsBar } from "@/components/admin/launch/campaign-stats";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Mass Email — GateCtr Admin",
};

async function RecipientsLoader() {
  const recipients = await getEmailRecipients();
  return <MassEmailClient recipients={recipients} />;
}

export default async function MassEmailPage() {
  await requirePermission("users:write");

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Mail className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Launch Email — Product Hunt
          </h1>
          <p className="text-sm text-muted-foreground">
            Send the PH launch announcement to active users. Rate-limited at 8
            emails/sec.
          </p>
        </div>
      </div>

      {/* Campaign stats — shown once emails have been sent */}
      <Suspense fallback={null}>
        <CampaignStatsBar template="launch-announcement" />
      </Suspense>

      <Suspense
        fallback={
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <RecipientsLoader />
      </Suspense>
    </div>
  );
}
