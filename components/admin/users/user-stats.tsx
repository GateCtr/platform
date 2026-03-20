"use client";

import { Users, UserCheck, UserX, Ban } from "lucide-react";
import type { UserRow } from "./types";

interface Props {
  users: UserRow[];
  t: (k: string) => string;
}

export function UserStats({ users, t }: Props) {
  const active = users.filter((u) => u.isActive && !u.isBanned).length;
  const suspended = users.filter((u) => !u.isActive && !u.isBanned).length;
  const banned = users.filter((u) => u.isBanned).length;

  const stats = [
    {
      label: t("stats.total"),
      value: users.length,
      icon: Users,
      color: "text-muted-foreground",
    },
    {
      label: t("stats.active"),
      value: active,
      icon: UserCheck,
      color: "text-secondary-600 dark:text-secondary-400",
    },
    {
      label: t("stats.suspended"),
      value: suspended,
      icon: UserX,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      label: t("stats.banned"),
      value: banned,
      icon: Ban,
      color: "text-error-600 dark:text-error-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-card p-3 flex items-center gap-3"
        >
          <div className={`rounded-md p-1.5 bg-muted ${color}`}>
            <Icon className="size-3.5" />
          </div>
          <div className="flex flex-col gap-0">
            <span className="text-lg font-bold tabular-nums leading-none">
              {value}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
