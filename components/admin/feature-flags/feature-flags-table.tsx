"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Users } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RolloutInput } from "./rollout-input";
import { FlagOverridesSheet } from "./flag-overrides-sheet";
import {
  toggleFlag,
  updateRollout,
  updateEnabledPlans,
} from "@/app/[locale]/(admin)/admin/feature-flags/_actions";

const PLAN_OPTIONS = ["FREE", "PRO", "TEAM", "ENTERPRISE"] as const;

interface Override {
  id: string;
  userId: string;
  enabled: boolean;
  user: { id: string; email: string; name: string | null };
}

export interface FeatureFlagRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rolloutPct: number;
  enabledPlans: string[];
  overrideCount: number;
  overrides?: Override[];
}

interface FeatureFlagsTableProps {
  flags: FeatureFlagRow[];
}

export function FeatureFlagsTable({ flags: initialFlags }: FeatureFlagsTableProps) {
  "use no memo";
  const t = useTranslations("adminFeatureFlags");
  const [data, setData] = React.useState<FeatureFlagRow[]>(initialFlags);
  const [sheetFlagId, setSheetFlagId] = React.useState<string | null>(null);
  const [sheetOverrides, setSheetOverrides] = React.useState<Override[]>([]);

  const sheetFlag = data.find((f) => f.id === sheetFlagId) ?? null;

  // ─── Optimistic helpers ──────────────────────────────────────────────────

  function patchFlag(id: string, patch: Partial<FeatureFlagRow>) {
    setData((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  async function handleToggle(id: string, enabled: boolean) {
    const prev = data.find((f) => f.id === id)!.enabled;
    patchFlag(id, { enabled }); // optimistic
    const result = await toggleFlag(id, enabled);
    if (!result.success) patchFlag(id, { enabled: prev }); // revert
  }

  async function handleRollout(id: string, rolloutPct: number) {
    const prev = data.find((f) => f.id === id)!.rolloutPct;
    patchFlag(id, { rolloutPct }); // optimistic
    const result = await updateRollout(id, rolloutPct);
    if (!result.success) patchFlag(id, { rolloutPct: prev }); // revert
  }

  async function handlePlanToggle(id: string, plan: string, checked: boolean) {
    const flag = data.find((f) => f.id === id)!;
    const prev = flag.enabledPlans;
    const next = checked
      ? [...prev, plan]
      : prev.filter((p) => p !== plan);
    patchFlag(id, { enabledPlans: next }); // optimistic
    const result = await updateEnabledPlans(id, next);
    if (!result.success) patchFlag(id, { enabledPlans: prev }); // revert
  }

  function openOverrides(flag: FeatureFlagRow) {
    setSheetFlagId(flag.id);
    setSheetOverrides(flag.overrides ?? []);
  }

  // ─── Columns ─────────────────────────────────────────────────────────────

  const columns: ColumnDef<FeatureFlagRow>[] = [
    {
      accessorKey: "key",
      header: t("table.key"),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.key}</span>
      ),
    },
    {
      accessorKey: "name",
      header: t("table.name"),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.original.name}</span>
          {row.original.description && (
            <span className="text-xs text-muted-foreground line-clamp-1">{row.original.description}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "enabled",
      header: t("table.enabled"),
      cell: ({ row }) => (
        <Switch
          checked={row.original.enabled}
          onCheckedChange={(checked) => handleToggle(row.original.id, checked)}
          aria-label={t("actions.toggle")}
        />
      ),
    },
    {
      accessorKey: "rolloutPct",
      header: t("table.rollout"),
      cell: ({ row }) => (
        <RolloutInput
          value={row.original.rolloutPct}
          onChange={(v) => handleRollout(row.original.id, v)}
          errorLabel={t("rollout.error")}
        />
      ),
    },
    {
      accessorKey: "enabledPlans",
      header: t("table.plans"),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {PLAN_OPTIONS.map((plan) => {
            const active = row.original.enabledPlans.includes(plan);
            return (
              <button
                key={plan}
                type="button"
                onClick={() => handlePlanToggle(row.original.id, plan, !active)}
                className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
                aria-pressed={active}
                aria-label={plan}
              >
                <Badge
                  variant={active ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                >
                  {plan}
                </Badge>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      accessorKey: "overrideCount",
      header: t("table.overrides"),
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => openOverrides(row.original)}
        >
          <Users className="size-3.5" />
          {row.original.overrideCount}
        </Button>
      ),
    },
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="rounded-md border">
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
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
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

      {sheetFlag && (
        <FlagOverridesSheet
          open={!!sheetFlagId}
          onOpenChange={(open) => { if (!open) setSheetFlagId(null); }}
          flagId={sheetFlag.id}
          flagKey={sheetFlag.key}
          overrides={sheetOverrides}
          onOverridesChange={(next) => {
            setSheetOverrides(next);
            patchFlag(sheetFlag.id, { overrideCount: next.length });
          }}
        />
      )}
    </>
  );
}
