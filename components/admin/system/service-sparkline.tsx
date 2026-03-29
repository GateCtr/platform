"use client";

import { useTranslations } from "next-intl";

interface ServiceSparklineProps {
  history: Array<{ status: string; checkedAt: Date | string }>;
  service: string;
}

const STATUS_COLOR: Record<string, string> = {
  healthy: "#10b981",
  degraded: "#f59e0b",
  down: "hsl(var(--destructive))",
  unknown: "#9ca3af",
};

function getColor(status: string): string {
  return STATUS_COLOR[status.toLowerCase()] ?? STATUS_COLOR.unknown;
}

export function ServiceSparkline({ history, service }: ServiceSparklineProps) {
  const t = useTranslations("adminSystem.services");

  if (history.length === 0) {
    return (
      <div className="flex items-center gap-2 h-5">
        <svg width="100%" height="20" className="flex-1 min-w-0">
          <rect x="0" y="4" width="100%" height="12" rx="2" fill="#e5e7eb" />
        </svg>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
          {t("noHistory")}
        </span>
      </div>
    );
  }

  const count = history.length;
  const gap = 1;
  // We use viewBox to make it responsive
  const totalWidth = 100;
  const segW = Math.max((totalWidth - gap * (count - 1)) / count, 1);

  return (
    <svg
      viewBox={`0 0 ${totalWidth} 20`}
      preserveAspectRatio="none"
      width="100%"
      height="20"
      aria-label={`${service} 24h history`}
    >
      {history.map((entry, i) => {
        const x = i * (segW + gap);
        const color = getColor(entry.status);
        const time =
          entry.checkedAt instanceof Date
            ? entry.checkedAt.toLocaleTimeString()
            : new Date(entry.checkedAt).toLocaleTimeString();
        return (
          <rect
            key={i}
            x={x}
            y={4}
            width={segW}
            height={12}
            rx={1}
            fill={color}
          >
            <title>{`${entry.status} — ${time}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
