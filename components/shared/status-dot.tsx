"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type OverallStatus = "healthy" | "degraded" | "down" | "unknown";

const STATUS_STYLES: Record<OverallStatus, string> = {
  healthy: "#22c55e",
  degraded: "#f59e0b",
  down: "#ef4444",
  unknown: "#6b7280",
};

export function StatusDot({ label }: { label: string }) {
  const [status, setStatus] = useState<OverallStatus>("unknown");
  const t = useTranslations("status");

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/system/health`
      : "/api/v1/system/health";
    fetch(apiUrl)
      .then((r) => r.json())
      .then((data: { status?: string }) => {
        const s = data?.status as OverallStatus | undefined;
        if (s && s in STATUS_STYLES) setStatus(s);
      })
      .catch(() => setStatus("unknown"));
  }, []);

  const color = STATUS_STYLES[status];
  const dotLabel =
    status === "healthy"
      ? label
      : t(`overall.${status}` as Parameters<typeof t>[0]);

  return (
    <a
      href={process.env.NEXT_PUBLIC_STATUS_URL ?? "https://status.gatectr.com"}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <span className="relative flex size-2">
        {status === "healthy" && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ backgroundColor: color }}
          />
        )}
        <span
          className="relative inline-flex rounded-full size-2"
          style={{ backgroundColor: color }}
        />
      </span>
      {dotLabel}
    </a>
  );
}
