"use client";

import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PLAN_STYLE } from "@/components/admin/users/types";

export interface TopUserRow {
  userId: string;
  tokens: number;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  plan: string;
}

interface TopUsersTableProps {
  data: TopUserRow[];
  isLoading?: boolean;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function initials(name: string | null, email: string): string {
  if (name) return name.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export function TopUsersTable({ data, isLoading }: TopUsersTableProps) {
  const t = useTranslations("adminAnalytics.tables.topUsers");

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card">
      <div className="px-4 pt-4">
        <span className="text-xs font-medium text-muted-foreground">
          {t("title")}
        </span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">{t("user")}</TableHead>
              <TableHead className="text-xs">{t("plan")}</TableHead>
              <TableHead className="text-xs text-right">
                {t("tokens")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-7 rounded-full" />
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2.5 w-32" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-14" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-20 text-center text-xs text-muted-foreground"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.userId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarImage src={row.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {initials(row.name, row.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        {row.name && (
                          <span className="text-xs font-medium truncate">
                            {row.name}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground truncate">
                          {row.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${PLAN_STYLE[row.plan] ?? ""}`}
                    >
                      {row.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums font-medium">
                    {formatTokens(row.tokens)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
