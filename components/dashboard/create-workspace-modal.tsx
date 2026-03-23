"use client";

import { useState, useTransition, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { createWorkspaceAction } from "@/app/[locale]/(dashboard)/_actions/create-workspace";
import { X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  userPlan: string;
}

export function CreateWorkspaceModal({
  open,
  onClose,
  userPlan,
}: CreateWorkspaceModalProps) {
  const t = useTranslations("dashboard.sidebar");
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // SSR-safe portal mount detection
  const isBrowser = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isPlanBlocked = userPlan === "FREE" || userPlan === "PRO";

  function handleClose() {
    setName("");
    setError(null);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.set("name", name);

    startTransition(async () => {
      const result = await createWorkspaceAction(fd);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      // Invalidate teams query so switcher refreshes
      queryClient.invalidateQueries({ queryKey: ["teams", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["active-team", user?.id] });
      handleClose();
      // Full reload to switch context
      window.location.href = "/dashboard";
    });
  }

  if (!open) return null;
  if (!isBrowser) return null;

  const content = (
    // Backdrop
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="text-sm font-semibold">{t("newWorkspace")}</p>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Plan gate */}
        {isPlanBlocked ? (
          <div className="px-5 py-6 space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/30">
              <Zap className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {t("workspacePlanRequired")}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {t("workspacePlanRequiredDesc")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/billing" className="flex-1" onClick={handleClose}>
                <Button variant="cta-accent" size="sm" className="w-full">
                  {t("upgradeToPro")}
                </Button>
              </Link>
              <Button variant="cta-ghost" size="sm" onClick={handleClose}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        ) : (
          /* Creation form */
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="workspace-name">{t("workspaceName")}</Label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("workspaceNamePlaceholder")}
                autoFocus
                minLength={2}
                maxLength={50}
                className={cn(
                  error === "name_required" && "border-destructive",
                )}
              />
              {error === "name_required" && (
                <p className="text-xs text-destructive">
                  {t("workspaceNameRequired")}
                </p>
              )}
              {error === "failed" && (
                <p className="text-xs text-destructive">
                  {t("workspaceCreateFailed")}
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="cta-ghost"
                size="sm"
                onClick={handleClose}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant="cta-primary"
                size="sm"
                disabled={isPending || name.trim().length < 2}
              >
                {isPending ? t("creating") : t("createWorkspace")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
