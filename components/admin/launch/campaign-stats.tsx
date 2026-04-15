import { getEmailCampaignStats } from "@/lib/actions/launch";
import { Mail, Eye, MousePointer, AlertTriangle } from "lucide-react";

interface Props {
  template: string;
}

export async function CampaignStatsBar({ template }: Props) {
  let stats;
  try {
    stats = await getEmailCampaignStats(template);
  } catch {
    return null;
  }

  if (stats.sent === 0) return null;

  const kpis = [
    {
      label: "Sent",
      value: stats.sent.toLocaleString(),
      icon: Mail,
      color: "text-foreground",
      bg: "bg-muted/40",
    },
    {
      label: "Open rate",
      value: `${stats.openRate}%`,
      icon: Eye,
      color: "text-primary",
      bg: "bg-primary/8",
    },
    {
      label: "Click rate",
      value: `${stats.clickRate}%`,
      icon: MousePointer,
      color: "text-secondary-500",
      bg: "bg-secondary-500/8",
    },
    {
      label: "Bounce rate",
      value: `${stats.bounceRate}%`,
      icon: AlertTriangle,
      color:
        stats.bounceRate > 5 ? "text-destructive" : "text-muted-foreground",
      bg: stats.bounceRate > 5 ? "bg-destructive/8" : "bg-muted/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {kpis.map((k) => (
        <div
          key={k.label}
          className={`flex items-center gap-3 rounded-lg border border-border p-3 ${k.bg}`}
        >
          <div className={`p-1.5 rounded-md bg-background/60 ${k.color}`}>
            <k.icon className="size-3.5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p
              className={`text-lg font-bold tabular-nums leading-none mt-0.5 ${k.color}`}
            >
              {k.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
