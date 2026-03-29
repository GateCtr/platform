"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Bell } from "lucide-react";
import {
  UnacknowledgedAlertsList,
  type AlertRow,
} from "@/components/admin/notifications/unacknowledged-alerts-list";
import { AcknowledgeAllButton } from "@/components/admin/notifications/acknowledge-all-button";
import {
  AlertHistoryTable,
  type AlertHistoryRow,
} from "@/components/admin/notifications/alert-history-table";
import { SeverityFilter } from "@/components/admin/notifications/severity-filter";
import { AcknowledgedFilter } from "@/components/admin/notifications/acknowledged-filter";
import { useAdminStore } from "@/lib/stores/admin-store";

interface NotificationsPayload {
  unacknowledged: AlertRow[];
  history: AlertHistoryRow[];
}

async function fetchNotifications(
  severity?: string,
  acknowledged?: string,
): Promise<NotificationsPayload> {
  const params = new URLSearchParams();
  if (severity) params.set("severity", severity);
  if (acknowledged) params.set("acknowledged", acknowledged);
  const qs = params.toString();
  const res = await fetch(`/api/admin/notifications${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json() as Promise<NotificationsPayload>;
}

export function NotificationsClient() {
  const t = useTranslations("adminNotifications");
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const setUnacknowledgedCount = useAdminStore((s) => s.setUnacknowledgedCount);

  const severity = searchParams.get("severity") ?? undefined;
  const acknowledged = searchParams.get("acknowledged") ?? undefined;

  const { data, isLoading, isError } = useQuery<NotificationsPayload>({
    queryKey: ["admin", "notifications", severity, acknowledged],
    queryFn: () => fetchNotifications(severity, acknowledged),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Keep the Zustand store in sync whenever this page fetches fresh data.
  // The dedicated useUnacknowledgedCount hook (mounted in the layout) is the
  // primary source, but syncing here ensures the badge updates immediately
  // after the user acknowledges alerts on this page.
  React.useEffect(() => {
    if (data?.unacknowledged !== undefined) {
      setUnacknowledgedCount(data.unacknowledged.length);
    }
  }, [data?.unacknowledged, setUnacknowledgedCount]);

  function invalidate() {
    void queryClient.invalidateQueries({
      queryKey: ["admin", "notifications"],
    });
    void queryClient.invalidateQueries({
      queryKey: ["admin", "unacknowledged-count"],
    });
  }

  const unacknowledged = data?.unacknowledged ?? [];
  const history = data?.history ?? [];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {t("errors.loadFailed")}
        </div>
      )}

      {/* Unacknowledged section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">
              {t("unacknowledged.title")}
              {unacknowledged.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-destructive-foreground">
                  {unacknowledged.length}
                </span>
              )}
            </h2>
          </div>
          <AcknowledgeAllButton
            count={unacknowledged.length}
            onAcknowledgedAll={invalidate}
          />
        </div>
        <UnacknowledgedAlertsList
          alerts={unacknowledged}
          onAcknowledged={invalidate}
        />
      </section>

      {/* History section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold">{t("history.title")}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityFilter />
            <AcknowledgedFilter />
          </div>
        </div>
        <AlertHistoryTable data={history} isLoading={isLoading} />
      </section>
    </div>
  );
}
