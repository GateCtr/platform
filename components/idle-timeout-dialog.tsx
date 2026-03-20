"use client";

import { useState, useEffect, useCallback } from "react";
import { useClerk } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";

const WARNING_MS = 2 * 60 * 1000; // 2 min warning
const IDLE_MS = 13 * 60 * 1000;   // 13 min idle → total 15 min

export function IdleTimeoutDialog() {
  const { signOut } = useClerk();
  const t = useTranslations("common.idle");
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => WARNING_MS / 1000);

  const handleIdle = useCallback(() => {
    setSecondsLeft(WARNING_MS / 1000);
    setOpen(true);
  }, []);

  const handleActivity = useCallback(() => {
    if (open) {
      setOpen(false);
    }
  }, [open]);

  const { resetTimers, startWarningCountdown, cancelWarning } = useIdleTimeout({
    idleMs: IDLE_MS,
    warningMs: WARNING_MS,
    onIdle: handleIdle,
    onActivity: handleActivity,
  });

  // Countdown ticker when dialog is open
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    // Auto sign-out after warning period
    startWarningCountdown(() => {
      signOut({ redirectUrl: "/sign-in" });
    });

    return () => clearInterval(interval);
  }, [open, startWarningCountdown, signOut]);

  const handleStaySignedIn = useCallback(() => {
    cancelWarning();
    setOpen(false);
    resetTimers();
  }, [cancelWarning, resetTimers]);

  const handleSignOut = useCallback(() => {
    cancelWarning();
    setOpen(false);
    signOut({ redirectUrl: "/sign-in" });
  }, [cancelWarning, signOut]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const countdown = `${minutes}:${String(seconds).padStart(2, "0")}`;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("description", { countdown })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="cta-ghost" onClick={handleSignOut}>
            {t("signOut")}
          </Button>
          <Button variant="cta-primary" onClick={handleStaySignedIn}>
            {t("staySignedIn")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
