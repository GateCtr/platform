"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Send, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { bulkSendEmail } from "@/lib/actions/outreach";
import { SendEmailDialog } from "./send-email-dialog";
import { AddProspectDialog } from "./add-prospect-dialog";
import type {
  SerializedProspect,
  SerializedTemplate,
  ActiveFilters,
} from "./outreach-page";

// ─── Status badge colours ─────────────────────────────────────────────────────

const STATUS_CLASS: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  CONTACTED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  REPLIED:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  MEETING_BOOKED:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  CONVERTED:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  REFUSED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  UNSUBSCRIBED:
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

const TIER_CLASS: Record<string, string> = {
  TIER_1:
    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-amber-300",
  TIER_2:
    "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300 border-sky-300",
};

const ALL_STATUSES = [
  "NEW",
  "CONTACTED",
  "REPLIED",
  "MEETING_BOOKED",
  "CONVERTED",
  "REFUSED",
  "UNSUBSCRIBED",
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProspectsTabProps {
  prospects: SerializedProspect[];
  templates: SerializedTemplate[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  activeFilters: ActiveFilters;
  onFiltersChange: (f: ActiveFilters) => void;
  dialogOpen: boolean;
  dialogProspect: SerializedProspect | null;
  onOpenDialog: (p: SerializedProspect) => void;
  onCloseDialog: () => void;
  onProspectUpdate: (p: SerializedProspect) => void;
  onProspectsAdded: (prospects: SerializedProspect[]) => void;
}

export function ProspectsTab({
  prospects,
  templates,
  selectedIds,
  onSelectionChange,
  activeFilters,
  onFiltersChange,
  dialogOpen,
  dialogProspect,
  onOpenDialog,
  onCloseDialog,
  onProspectUpdate,
  onProspectsAdded,
}: ProspectsTabProps) {
  const t = useTranslations("adminOutreach");
  const [isPending, startTransition] = useTransition();
  const [bulkStep, setBulkStep] = useState<number>(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // ─── Filtered data ──────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = activeFilters.search.toLowerCase();
    return prospects.filter((p) => {
      if (
        q &&
        !p.firstName.toLowerCase().includes(q) &&
        !p.lastName.toLowerCase().includes(q) &&
        !p.email.toLowerCase().includes(q) &&
        !p.company.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (
        activeFilters.statuses.length > 0 &&
        !activeFilters.statuses.includes(p.status)
      ) {
        return false;
      }
      if (activeFilters.tier && p.tier !== activeFilters.tier) {
        return false;
      }
      return true;
    });
  }, [prospects, activeFilters]);

  // ─── Columns ────────────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<SerializedProspect>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(v) => {
              table.toggleAllPageRowsSelected(!!v);
              if (v) {
                onSelectionChange(filtered.map((p) => p.id));
              } else {
                onSelectionChange([]);
              }
            }}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.includes(row.original.id)}
            onCheckedChange={(v) => {
              if (v) {
                onSelectionChange([...selectedIds, row.original.id]);
              } else {
                onSelectionChange(
                  selectedIds.filter((id) => id !== row.original.id),
                );
              }
            }}
            aria-label="Select row"
          />
        ),
        size: 40,
      },
      {
        accessorKey: "firstName",
        header: t("prospects.columns.name"),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">
              {row.original.firstName} {row.original.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.email}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "company",
        header: t("prospects.columns.company"),
      },
      {
        accessorKey: "jobTitle",
        header: t("prospects.columns.jobTitle"),
        cell: ({ getValue }) => (getValue() as string | null) ?? "—",
      },
      {
        accessorKey: "tier",
        header: t("prospects.columns.tier"),
        cell: ({ getValue }) => {
          const tier = getValue() as string;
          return (
            <Badge variant="outline" className={TIER_CLASS[tier] ?? ""}>
              {t(`prospects.tier.${tier}` as Parameters<typeof t>[0])}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("prospects.columns.status"),
        cell: ({ getValue }) => {
          const status = getValue() as string;
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[status] ?? ""}`}
            >
              {t(`prospects.status.${status}` as Parameters<typeof t>[0])}
            </span>
          );
        },
      },
      {
        accessorKey: "lastContactedAt",
        header: t("prospects.columns.lastContacted"),
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          if (!v)
            return (
              <span className="text-muted-foreground text-xs">
                {t("prospects.never")}
              </span>
            );
          return (
            <span className="text-xs">{new Date(v).toLocaleDateString()}</span>
          );
        },
      },
      {
        id: "actions",
        header: t("prospects.columns.actions"),
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenDialog(row.original)}
          >
            <Mail className="size-3.5 mr-1.5" />
            {t("prospects.actions.sendEmail")}
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, selectedIds, filtered],
  );

  // ─── Table instance ─────────────────────────────────────────────────────

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  // ─── Bulk send ──────────────────────────────────────────────────────────

  function handleBulkSend() {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      try {
        const result = await bulkSendEmail(selectedIds, bulkStep);
        toast.success(
          t("bulkSend.success", {
            sent: result.sent,
            failed: result.failed,
          }),
        );
        onSelectionChange([]);
      } catch {
        toast.error(t("bulkSend.error"));
      }
    });
  }

  // ─── Filter helpers ─────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder={t("prospects.filters.searchPlaceholder")}
          value={activeFilters.search}
          onChange={(e) =>
            onFiltersChange({ ...activeFilters, search: e.target.value })
          }
          className="max-w-xs"
        />

        {/* Status filter */}
        <Select
          value={activeFilters.statuses[0] ?? "all"}
          onValueChange={(v) =>
            onFiltersChange({
              ...activeFilters,
              statuses: v === "all" ? [] : [v],
            })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("prospects.filters.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("prospects.filters.allStatuses")}
            </SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`prospects.status.${s}` as Parameters<typeof t>[0])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tier toggle */}
        <div className="flex gap-1">
          {(["TIER_1", "TIER_2"] as const).map((tier) => (
            <Button
              key={tier}
              size="sm"
              variant={activeFilters.tier === tier ? "default" : "outline"}
              onClick={() =>
                onFiltersChange({
                  ...activeFilters,
                  tier: activeFilters.tier === tier ? null : tier,
                })
              }
            >
              {t(`prospects.tier.${tier}` as Parameters<typeof t>[0])}
            </Button>
          ))}
        </div>

        {/* Add prospect button */}
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={() => setAddDialogOpen(true)}
        >
          <UserPlus className="size-3.5 mr-1.5" />
          {t("addProspect.button")}
        </Button>

        {/* Bulk send */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Select
              value={String(bulkStep)}
              onValueChange={(v) => setBulkStep(Number(v))}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3].map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {t("sendDialog.stepLabel", { step: s })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleBulkSend} disabled={isPending}>
              <Send className="size-3.5 mr-1.5" />
              {t("prospects.actions.bulkSend", { count: selectedIds.length })}
            </Button>
          </div>
        )}
      </div>

      {/* Table with horizontal scroll for mobile */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
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
                  className="text-center text-muted-foreground py-8"
                >
                  {t("prospects.empty")}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={
                    selectedIds.includes(row.original.id)
                      ? "selected"
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {t("prospects.pagination.showing", {
            from:
              table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
              1,
            to: Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              filtered.length,
            ),
            total: filtered.length,
          })}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="px-2">
            {t("prospects.pagination.page", {
              page: table.getState().pagination.pageIndex + 1,
              total: table.getPageCount(),
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Send email dialog */}
      {dialogProspect && (
        <SendEmailDialog
          open={dialogOpen}
          prospect={dialogProspect}
          templates={templates}
          onClose={onCloseDialog}
          onProspectUpdate={onProspectUpdate}
        />
      )}

      {/* Add prospect dialog */}
      <AddProspectDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onProspectsAdded={(newProspects) => {
          onProspectsAdded(newProspects);
          setAddDialogOpen(false);
        }}
      />
    </div>
  );
}
