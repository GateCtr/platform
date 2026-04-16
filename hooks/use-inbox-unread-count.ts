import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdminStore } from "@/lib/stores/admin-store";

async function fetchInboxUnreadCount(): Promise<number> {
  const res = await fetch("/api/v1/inbox?filter=unread&limit=1");
  if (!res.ok) return 0;
  const data = await res.json();
  return data.unreadCount ?? 0;
}

/**
 * Fetches inbox unread count and syncs it to the admin store.
 * Call once in the admin layout — the store value is then read by the sidebar.
 */
export function useInboxUnreadCount() {
  const setInboxUnreadCount = useAdminStore((s) => s.setInboxUnreadCount);

  const query = useQuery<number>({
    queryKey: ["admin", "inbox-unread-count"],
    queryFn: fetchInboxUnreadCount,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (query.data !== undefined) {
      setInboxUnreadCount(query.data);
    }
  }, [query.data, setInboxUnreadCount]);

  return query;
}
