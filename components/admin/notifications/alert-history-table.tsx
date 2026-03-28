"use client";

import { useTranslations } from "next-intl";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { AlertTriangle, XCircle, Info, CheckCircle2, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AlertSeverity } from "@/lib/admin/utils";

export interface AlertHistoryRow {
  id: string;
  severity: AlertSeverity;
  message: string;
  createdAt: Date;
  acknowledged: boolean;
  rule: { name: string } | null;
}

interface AlertHistoryTableProps {
  data: AlertHistoryRow[];
  isLoading?: boolean;
}

const SEVERITY_CONFIG = {
  critical: {
    icon: XCircle,
    badgeClass: "border-destructive/40 bg-destructive/10 text-destructive",
    iconClass: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    badgeClass: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    iconClass: "text-amber-500",
  },
  info: {
    icon: Info,
    badgeClass: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    iconClass: "text-blue-500",
  },
} as const;

function formatDate(date: Date): string {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const columnHelper = createColumnHelper<AlertHistoryRow>();

export function AlertHistoryTable({ data, isLoading }: AlertHistoryTableProps) {
  const t = useTranslations("adminNotifications.history");

  const columns = [
    columnHelper.accessor("severity", {
      header: t("severity"),
      cell: (info) => {
        const sev = info.getValue();
        const config = SEVERITY_CONFIG[sev];
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-1.5">
            <Icon className={cn("size-3.5 shrink-0", config.iconClass)} />
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0 capitalize", config.badgeClass)}
            >
              {sev}
            </Badge>
          </div>
        );
      },
    }),
    columnHelper.accessor("message", {
      header: t("message"),
      cell: (info) => (
        <span className="text-xs line-clamp-2 max-w-xs">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor((row) => row.rule?.name ?? "—", {
      id: "ruleName",
      header: t("rule"),
      cell: (info) => (
        <span className="text-xs text-muted-foreground">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: t("createdAt"),
      cell: (info) => (
        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
          {formatDate(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor("acknowledged", {
      header: t("status"),
      cell: (info) =>
        info.getValue() ? (
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            <span className="text-xs">{t("acknowledged")}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="size-3.5" />
            <span className="text-xs">{t("pending")}</span>
          </div>
        ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-20 text-center text-xs text-muted-foreground"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
