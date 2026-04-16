"use client";

import { useUnacknowledgedCount } from "@/hooks/use-unacknowledged-count";
import { useInboxUnreadCount } from "@/hooks/use-inbox-unread-count";

/**
 * Mounts the unacknowledged-count polling hook once at the admin layout level.
 * Both the sidebar badge and the notifications page read from the Zustand store
 * populated here — no double-fetching.
 */
export function AdminStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useUnacknowledgedCount();
  useInboxUnreadCount();
  return <>{children}</>;
}
