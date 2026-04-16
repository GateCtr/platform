import { create } from "zustand";

interface AdminState {
  unacknowledgedCount: number;
  setUnacknowledgedCount: (count: number) => void;
  inboxUnreadCount: number;
  setInboxUnreadCount: (count: number) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  unacknowledgedCount: 0,
  setUnacknowledgedCount: (count) => set({ unacknowledgedCount: count }),
  inboxUnreadCount: 0,
  setInboxUnreadCount: (count) => set({ inboxUnreadCount: count }),
}));
