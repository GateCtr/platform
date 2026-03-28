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
import { Skeleton } from "@/components/ui/skeleton";

interface ModelRow {
  model: string;
  provider: string;
  tokens: number;
  pctOfTotal: number;
}

interface ModelBreakdownTableProps {
  data: ModelRow[];
  isLoading?: boolean;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function ModelBreakdownTable({
  data,
  isLoading,
}: ModelBreakdownTableProps) {
  const t = useTranslations("adminAnalytics.tables.modelBreakdown");

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
              <TableHead className="text-xs">{t("model")}</TableHead>
              <TableHead className="text-xs">{t("provider")}</TableHead>
              <TableHead className="text-xs text-right">
                {t("tokens")}
              </TableHead>
              <TableHead className="text-xs text-right">
                {t("pctOfTotal")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-3 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-10 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-20 text-center text-xs text-muted-foreground"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={`${row.provider}/${row.model}`}>
                  <TableCell className="font-mono text-xs">
                    {row.model}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground capitalize">
                    {row.provider}
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums">
                    {formatTokens(row.tokens)}
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums text-muted-foreground">
                    {row.pctOfTotal.toFixed(1)}%
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
