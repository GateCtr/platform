"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { ActionsMenu } from "./actions-menu";
import type { UserRow, SortField, SortDir, ConfirmType } from "./types";
import { ROLE_STYLE, PLAN_STYLE } from "./types";
import { formatRelative } from "./utils";

interface Props {
  users: UserRow[];
  canWrite: boolean;
  sortField: SortField;
  sortDir: SortDir;
  feedback: { id: string; msg: string; ok: boolean } | null;
  onSort: (f: SortField) => void;
  onView: (u: UserRow) => void;
  onRemoveRole: (u: UserRow) => void;
  onConfirm: (type: ConfirmType, u: UserRow) => void;
  onBanOpen: (u: UserRow) => void;
  t: (k: string) => string;
  locale: string;
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (field !== sortField) return <ArrowUpDown className="size-3 ml-1 opacity-40" />;
  return sortDir === "asc"
    ? <ArrowUp className="size-3 ml-1 text-primary" />
    : <ArrowDown className="size-3 ml-1 text-primary" />;
}

function SortableHead({ field, label, sortField, sortDir, onSort, className }: {
  field: SortField; label: string; sortField: SortField; sortDir: SortDir;
  onSort: (f: SortField) => void; className?: string;
}) {
  return (
    <TableHead className={className}>
      <button
        className="flex items-center text-xs font-medium hover:text-foreground transition-colors"
        onClick={() => onSort(field)}
      >
        {label}
        <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </button>
    </TableHead>
  );
}

export function UserTable({
  users, canWrite, sortField, sortDir, feedback,
  onSort, onView, onRemoveRole, onConfirm, onBanOpen, t, locale,
}: Props) {
  if (users.length === 0) return null;

  return (
    <div className="hidden md:block rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <SortableHead field="name"        label={t("table.name")}      sortField={sortField} sortDir={sortDir} onSort={onSort} className="w-[240px]" />
            <TableHead>{t("table.roles")}</TableHead>
            <SortableHead field="plan"        label={t("table.plan")}      sortField={sortField} sortDir={sortDir} onSort={onSort} />
            <TableHead>{t("table.status")}</TableHead>
            <SortableHead field="tokenUsage"  label={t("table.tokens")}    sortField={sortField} sortDir={sortDir} onSort={onSort} />
            <SortableHead field="lastLoginAt" label={t("table.lastLogin")} sortField={sortField} sortDir={sortDir} onSort={onSort} />
            <SortableHead field="createdAt"   label={t("table.joined")}    sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-right" />
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const initials = (user.name ?? user.email).split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const isFeedback = feedback?.id === user.id;
            return (
              <TableRow
                key={user.id}
                className={`cursor-pointer ${user.isBanned ? "opacity-50" : ""}`}
                onClick={() => onView(user)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <button className="flex items-center gap-3 text-left w-full" onClick={() => onView(user)}>
                    <Avatar className="size-8 rounded-lg shrink-0">
                      <AvatarImage src={user.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-[11px] font-semibold rounded-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium truncate">{user.name ?? "—"}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
                    </div>
                  </button>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.length === 0
                      ? <span className="text-xs text-muted-foreground">—</span>
                      : user.roles.map((r) => (
                        <Badge key={r.name} variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider h-5 px-1.5 ${ROLE_STYLE[r.name] ?? ROLE_STYLE.VIEWER}`}>
                          {r.displayName}
                        </Badge>
                      ))}
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider h-5 px-1.5 ${PLAN_STYLE[user.plan]}`}>
                    {user.plan}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {isFeedback
                    ? <span className={`text-xs font-medium ${feedback.ok ? "text-secondary-600" : "text-error-600"}`}>{feedback.msg}</span>
                    : <StatusBadge user={user} t={t} />
                  }
                </TableCell>
                <TableCell className="text-sm tabular-nums text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                  {user.tokenUsage.toLocaleString()}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                  {user.lastLoginAt ? formatRelative(user.lastLoginAt, locale) : <span className="text-muted-foreground/50">—</span>}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground tabular-nums" onClick={(e) => e.stopPropagation()}>
                  {new Date(user.createdAt).toLocaleDateString(locale)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <ActionsMenu
                    user={user} canWrite={canWrite} t={t}
                    onView={() => onView(user)}
                    onRemoveRole={() => onRemoveRole(user)}
                    onConfirm={(type) => onConfirm(type, user)}
                    onBanOpen={() => onBanOpen(user)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
