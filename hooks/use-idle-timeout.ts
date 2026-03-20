"use client";

import { useEffect, useRef, useCallback } from "react";

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"] as const;

interface UseIdleTimeoutOptions {
  /** Time in ms before showing the warning dialog (default: 13 min) */
  idleMs?: number;
  /** Time in ms after warning before auto sign-out (default: 2 min) */
  warningMs?: number;
  onIdle: () => void;
  onActivity?: () => void;
}

export function useIdleTimeout({
  idleMs = 13 * 60 * 1000,
  warningMs = 2 * 60 * 1000,
  onIdle,
  onActivity,
}: UseIdleTimeoutOptions) {
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
  }, []);

  const resetTimers = useCallback(() => {
    clearTimers();
    onActivity?.();
    idleTimer.current = setTimeout(onIdle, idleMs);
  }, [clearTimers, onIdle, onActivity, idleMs]);

  // Expose a way to start the warning countdown separately
  const startWarningCountdown = useCallback((onExpire: () => void) => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    warningTimer.current = setTimeout(onExpire, warningMs);
  }, [warningMs]);

  const cancelWarning = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
  }, []);

  useEffect(() => {
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetTimers, { passive: true }));
    resetTimers(); // start on mount

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimers));
    };
  }, [resetTimers, clearTimers]);

  return { resetTimers, startWarningCountdown, cancelWarning };
}
