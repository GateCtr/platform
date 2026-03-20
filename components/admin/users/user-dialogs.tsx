"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { UserRow, ConfirmType, PlanType } from "./types";
import { ALL_PLANS } from "./types";

interface Props {
  confirmAction: { type: ConfirmType; user: UserRow } | null;
  banReason: string;
  selectedPlan: PlanType | null;
  onBanReasonChange: (v: string) => void;
  onPlanChange: (v: PlanType) => void;
  onCancel: () => void;
  onConfirm: () => void;
  t: (k: string, params?: Record<string, string>) => string;
}

export function UserDialogs({
  confirmAction,
  banReason,
  selectedPlan,
  onBanReasonChange,
  onPlanChange,
  onCancel,
  onConfirm,
  t,
}: Props) {
  const isDestructive =
    confirmAction?.type === "delete" || confirmAction?.type === "ban";

  return (
    <AlertDialog
      open={!!confirmAction}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
    >
      <AlertDialogContent>
        {confirmAction && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t(`confirm.${confirmAction.type}.title`)}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t(`confirm.${confirmAction.type}.description`, {
                  email: confirmAction.user.email,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {confirmAction.type === "ban" && (
              <div className="flex flex-col gap-1.5 py-2">
                <Label className="text-xs">
                  {t("confirm.ban.reasonLabel")}
                </Label>
                <Input
                  value={banReason}
                  onChange={(e) => onBanReasonChange(e.target.value)}
                  placeholder={t("confirm.ban.reasonPlaceholder")}
                  className="h-8 text-sm"
                />
              </div>
            )}

            {confirmAction.type === "changePlan" && (
              <div className="flex flex-col gap-1.5 py-2">
                <Label className="text-xs">
                  {t("confirm.changePlan.selectLabel")}
                </Label>
                <Select
                  value={selectedPlan ?? confirmAction.user.plan}
                  onValueChange={(v) => onPlanChange(v as PlanType)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_PLANS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel onClick={onCancel}>
                {t("confirm.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                className={
                  isDestructive
                    ? "bg-error-600 hover:bg-error-700 text-white"
                    : ""
                }
                onClick={onConfirm}
              >
                {t(`confirm.${confirmAction.type}.confirm`)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
