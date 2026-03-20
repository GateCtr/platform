"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./status-badge";
import { ActionsMenu } from "./actions-menu";
import type { UserRow, ConfirmType } from "./types";
import { ROLE_STYLE, PLAN_STYLE } from "./types";
import { formatRelative } from "./utils";

interface Props {
  users: UserRow[];
  canWrite: boolean;
  onView: (u: UserRow) => void;
  onRemoveRole: (u: UserRow) => void;
  onConfirm: (type: ConfirmType, u: UserRow) => void;
  onBanOpen: (u: UserRow) => void;
  t: (k: string) => string;
  locale: string;
}

export function UserCards({ users, canWrite, onView, onRemoveRole, onConfirm, onBanOpen, t, locale }: Props) {
  if (users.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 md:hidden">
      {users.map((user) => {
        const initials = (user.name ?? user.email).split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
        return (
          <div
            key={user.id}
            className="rounded-lg border border-border bg-card p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => onView(user)}
          >
            <Avatar className="size-9 rounded-lg shrink-0">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="text-[11px] font-semibold rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user.name ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <ActionsMenu
                    user={user} canWrite={canWrite} t={t}
                    onView={() => onView(user)}
                    onRemoveRole={() => onRemoveRole(user)}
                    onConfirm={(type) => onConfirm(type, user)}
                    onBanOpen={() => onBanOpen(user)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <StatusBadge user={user} t={t} />
                <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${PLAN_STYLE[user.plan]}`}>{user.plan}</Badge>
                {user.roles.map((r) => (
                  <Badge key={r.name} variant="outline" className={`text-[10px] h-5 px-1.5 ${ROLE_STYLE[r.name] ?? ROLE_STYLE.VIEWER}`}>{r.displayName}</Badge>
                ))}
              </div>
              {user.lastLoginAt && (
                <p className="text-[10px] text-muted-foreground/70">
                  {t("table.lastLogin")}: {formatRelative(user.lastLoginAt, locale)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
