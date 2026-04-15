import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import {
  getConversionFunnel,
  getCohortRetention,
  getSignupTimeSeries,
  getEmailCampaignStats,
  getReferralStats,
  getPromoRedemptionStats,
} from "@/lib/actions/launch";
import { FunnelChart } from "@/components/admin/launch/funnel-chart";
import { CohortTable } from "@/components/admin/launch/cohort-table";
import { SignupTimeSeries } from "@/components/admin/launch/signup-time-series";
import { CampaignStatsBar } from "@/components/admin/launch/campaign-stats";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, TrendingUp, Mail, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Launch Analytics — GateCtr Admin",
};

export default async function LaunchAnalyticsPage() {
  await requirePermission("analytics:read");

  const [
    funnel,
    cohorts,
    timeSeries,
    campaignStats,
    referralStats,
    promoStats,
  ] = await Promise.all([
    getConversionFunnel().catch(() => []),
    getCohortRetention().catch(() => []),
    getSignupTimeSeries(30).catch(() => []),
    getEmailCampaignStats("launch-announcement").catch(() => null),
    getReferralStats().catch(() => []),
    getPromoRedemptionStats(process.env.PH_COUPON_ID ?? "PRODUCTHUNT26").catch(
      () => null,
    ),
  ]);

  const phStats = referralStats.find((s) => s.source === "producthunt");
  const totalSignups = referralStats.reduce((a, s) => a + s.count, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Rocket className="size-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Launch Analytics
            </h1>
            <p className="text-sm text-muted-foreground">
              Product Hunt launch — conversion funnel, cohorts, email campaign
            </p>
          </div>
        </div>
        {phStats && (
          <Badge
            variant="outline"
            className="text-sm bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 px-3 py-1"
          >
            🚀 {phStats.count} from Product Hunt
          </Badge>
        )}
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="py-4">
          <CardContent className="px-5 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Users className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total signups</p>
              <p className="text-2xl font-bold tabular-nums">{totalSignups}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-5 flex items-center gap-3">
            <div className="p-2 rounded-md bg-orange-500/10">
              <Rocket className="size-4 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">From PH</p>
              <p className="text-2xl font-bold tabular-nums">
                {phStats?.count ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-5 flex items-center gap-3">
            <div className="p-2 rounded-md bg-emerald-500/10">
              <TrendingUp className="size-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Promo redeemed</p>
              <p className="text-2xl font-bold tabular-nums">
                {promoStats?.redemptions ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-5 flex items-center gap-3">
            <div className="p-2 rounded-md bg-secondary-500/10">
              <Gift className="size-4 text-secondary-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revenue (est.)</p>
              <p className="text-2xl font-bold tabular-nums">
                ${((promoStats?.revenue ?? 0) / 100).toFixed(0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signup time series */}
      <Card className="py-0 overflow-hidden">
        <CardHeader className="px-5 py-4 border-b border-border bg-muted/30">
          <CardTitle className="text-base">Signups over time</CardTitle>
          <CardDescription>Last 30 days, by referral source</CardDescription>
        </CardHeader>
        <CardContent className="px-5 py-4">
          <SignupTimeSeries data={timeSeries} />
        </CardContent>
      </Card>

      {/* Email campaign */}
      {campaignStats && campaignStats.sent > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Mail className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">
              Email campaign
            </h2>
          </div>
          <CampaignStatsBar template="launch-announcement" />
        </div>
      )}

      {/* Conversion funnel */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">
            Conversion funnel by source
          </h2>
        </div>
        <FunnelChart data={funnel} />
      </div>

      {/* Cohort retention */}
      <Card className="py-0 overflow-hidden">
        <CardHeader className="px-5 py-4 border-b border-border bg-muted/30">
          <CardTitle className="text-base">Cohort retention</CardTitle>
          <CardDescription>
            % of users still active at week +1, +2, +4 after signup
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 py-4">
          <CohortTable data={cohorts} />
        </CardContent>
      </Card>
    </div>
  );
}
