"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal, ChevronRight, ShieldCheck, ShieldOff,
  LogOut, UserX, UserCheck, Ban, Trash2, CreditCard, Eye,
} from "lucide-react";
import type { UserRow, ConfirmType } from "./types";

interface Props {
  user: UserRow;
  canWrite: boolean;
  t: (k: string) => string;
  onView: () => void;
  onRemoveRole: () => void;
  onConfirm: (type: ConfirmType) => void;
  onBanOpen: () => void;
}

export function ActionsMenu({ user, canWrite, t, onView, onRemoveRole, onConfirm, onBanOpen }: Props) {
  if (!canWrite) return (
    <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={onView}>
      <Eye className="size-3.5" />
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7 shrink-0">
          <MoreHorizontal className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={onView}>
          <ChevronRight className="size-3.5 mr-2" />{t("actions.viewDetails")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* RBAC */}
        <DropdownMenuItem onClick={onView}>
          <ShieldCheck className="size-3.5 mr-2" />{t("actions.assignRole")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRemoveRole}>
          <ShieldOff className="size-3.5 mr-2" />{t("actions.revokeRole")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Plan */}
        <DropdownMenuItem onClick={() => onConfirm("changePlan")}>
          <CreditCard className="size-3.5 mr-2" />{t("actions.changePlan")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Session */}
        <DropdownMenuItem onClick={() => onConfirm("signout")}>
          <LogOut className="size-3.5 mr-2" />{t("actions.forceSignOut")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Account state */}
        {user.isActive && !user.isBanned && (
          <DropdownMenuItem onClick={() => onConfirm("suspend")}>
            <UserX className="size-3.5 mr-2" />{t("actions.suspend")}
          </DropdownMenuItem>
        )}
        {(!user.isActive || user.isBanned) && (
          <DropdownMenuItem onClick={() => onConfirm("reactivate")}>
            <UserCheck className="size-3.5 mr-2" />{t("actions.reactivate")}
          </DropdownMenuItem>
        )}
        {!user.isBanned && (
          <DropdownMenuItem
            className="text-error-600 dark:text-error-400 focus:text-error-600"
            onClick={onBanOpen}
          >
            <Ban className="size-3.5 mr-2" />{t("actions.ban")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-error-600 dark:text-error-400 focus:text-error-600"
          onClick={() => onConfirm("delete")}
        >
          <Trash2 className="size-3.5 mr-2" />{t("actions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
