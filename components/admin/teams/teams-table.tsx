"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export interface TeamRow {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  ownerPlan: string;
  memberCount: number;
  projectCount: number;
  createdAt: string;
}

const PLAN_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  FREE: "outline",
  PRO: "secondary",
  TEAM: "default",
  ENTERPRISE: "default",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface TeamsTableProps {
  teams: TeamRow[];
  total: number;
  page: number;
  pageSize: number;
}

export function TeamsTable({ teams, total, page, pageSize }: TeamsTableProps) {
  "use no memo";
  const t = useTranslations("adminTeams");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ─── Debounced search ────────────────────────────────────────────────────

  const [searchValue, setSearchValue] = React.useState(
    searchParams.get("search") ?? "",
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) {
        params.set("search", searchValue);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Pagination ──────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / pageSize);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  // ─── Columns ─────────────────────────────────────────────────────────────

  const columns: ColumnDef<TeamRow>[] = [
    {
      accessorKey: "name",
      header: t("table.name"),
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "slug",
      header: t("table.slug"),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.slug}
        </span>
      ),
    },
    {
      accessorKey: "ownerEmail",
      header: t("table.owner"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.ownerEmail}
        </span>
      ),
    },
    {
      accessorKey: "memberCount",
      header: t("table.members"),
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">{row.original.memberCount}</span>
      ),
    },
    {
      accessorKey: "ownerPlan",
      header: t("table.plan"),
      cell: ({ row }) => (
        <Badge variant={PLAN_VARIANT[row.original.ownerPlan] ?? "outline"}>
          {row.original.ownerPlan}
        </Badge>
      ),
    },
    {
      accessorKey: "projectCount",
      header: t("table.projects"),
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">{row.original.projectCount}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: t("table.created"),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: teams,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-0">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder={t("search.placeholder")}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    router.push(`/admin/teams/${row.original.id}`)
                  }
                >
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{" "}
            {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
