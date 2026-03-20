"use client";

import { Badge } from "@/components/ui/badge";
import type { UserRow } from "./types";

export function StatusBadge({ user, t }: { user: UserRow; t: (k: string) => string }) {
  if (user.isBanned) return (
    <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-error-500/10 text-error-700 border-error-500/25 dark:text-error-400">
      {t("status.banned")}
    </Badge>
  );
  if (!user.isActive) return (
    <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400">
      {t("status.suspended")}
    </Badge>
  );
  return (
    <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-secondary-500/10 text-secondary-700 border-secondary-500/25 dark:text-secondary-400">
      {t("status.active")}
    </Badge>
  );
}
