"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAdminStore } from "@/lib/stores/admin-store";

interface NotificationsPayload {
  unacknowledged: { id: string }[];
}

async function fetchUnacknowledgedCount(): Promise<number> {
  const res = await fetch("/api/admin/notifications?acknowledged=false");
  if (!res.ok) return 0;
  const data = (await res.json()) as NotificationsPayload;
  return data.unacknowledged?.length ?? 0;
}

/**
 * Fetches the unacknowledged alert count every 60s and syncs it into the
 * Zustand admin store. Mount this hook once (e.g. in the admin layout provider)
 * so the sidebar badge and notifications page share the same value without
 * double-fetching.
 */
export function useUnacknowledgedCount() {
  const setUnacknowledgedCount = useAdminStore((s) => s.setUnacknowledgedCount);

  const query = useQuery<number>({
    queryKey: ["admin", "unacknowledged-count"],
    queryFn: fetchUnacknowledgedCount,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (query.data !== undefined) {
      setUnacknowledgedCount(query.data);
    }
  }, [query.data, setUnacknowledgedCount]);

  return query;
}
