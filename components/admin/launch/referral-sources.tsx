import { getReferralStats } from "@/lib/actions/launch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

export async function ReferralSourcesWidget() {
  let stats;
  try {
    stats = await getReferralStats();
  } catch {
    return null;
  }

  if (stats.length === 0) return null;

  const phStats = stats.find((s) => s.source === "producthunt");

  return (
    <Card className="py-0 overflow-hidden">
      <CardHeader className="px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Referral Sources
          </CardTitle>
          {phStats && (
            <Badge
              variant="outline"
              className="text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
            >
              🚀 PH: {phStats.count}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {stats.slice(0, 6).map((s) => (
            <div
              key={s.source}
              className="flex items-center justify-between px-5 py-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-foreground truncate">
                  {s.source}
                </span>
                {s.last24h > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <TrendingUp className="size-2.5" />+{s.last24h}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
                  {s.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
