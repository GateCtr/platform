"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download } from "lucide-react";
import type { StatusFilter, RoleFilter, PlanFilter } from "./types";
import { ALL_ROLES } from "./types";

interface Props {
  search: string;
  statusFilter: StatusFilter;
  roleFilter: RoleFilter;
  planFilter: PlanFilter;
  onSearch: (v: string) => void;
  onStatus: (v: StatusFilter) => void;
  onRole: (v: RoleFilter) => void;
  onPlan: (v: PlanFilter) => void;
  onExport: () => void;
  t: (k: string) => string;
}

export function UserFilters({
  search,
  statusFilter,
  roleFilter,
  planFilter,
  onSearch,
  onStatus,
  onRole,
  onPlan,
  onExport,
  t,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t("filters.search")}
          className="h-8 pl-8 text-sm"
        />
      </div>
      <Select
        value={statusFilter}
        onValueChange={(v) => onStatus(v as StatusFilter)}
      >
        <SelectTrigger className="h-8 text-sm w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
          <SelectItem value="active">{t("status.active")}</SelectItem>
          <SelectItem value="inactive">{t("status.suspended")}</SelectItem>
          <SelectItem value="banned">{t("status.banned")}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={roleFilter} onValueChange={(v) => onRole(v as RoleFilter)}>
        <SelectTrigger className="h-8 text-sm w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.allRoles")}</SelectItem>
          {ALL_ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={planFilter} onValueChange={(v) => onPlan(v as PlanFilter)}>
        <SelectTrigger className="h-8 text-sm w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.allPlans")}</SelectItem>
          <SelectItem value="FREE">Free</SelectItem>
          <SelectItem value="PRO">Pro</SelectItem>
          <SelectItem value="TEAM">Team</SelectItem>
          <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5"
        onClick={onExport}
      >
        <Download className="size-3.5" />
        <span className="hidden sm:inline">{t("filters.export")}</span>
      </Button>
    </div>
  );
}
