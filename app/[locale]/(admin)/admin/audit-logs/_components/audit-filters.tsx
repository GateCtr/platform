"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";
import { Search, Filter, X, Download, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AuditFiltersProps {
  resources: string[];
  labels: {
    search: string;
    resource: string;
    status: string;
    statusAll: string;
    statusSuccess: string;
    statusFailed: string;
    actor: string;
    action: string;
    dateRange: string;
    dateFrom: string;
    dateTo: string;
    applyDateRange: string;
    clearDateRange: string;
    clearAll: string;
    export: string;
  };
  exportHref: string;
}

export function AuditFilters({
  resources,
  labels,
  exportHref,
}: AuditFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  const current = {
    search: searchParams.get("search") ?? "",
    resource: searchParams.get("resource") ?? "all",
    status: searchParams.get("status") ?? "all",
    actor: searchParams.get("actor") ?? "",
    action: searchParams.get("action") ?? "",
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
  };

  const hasDateRange = !!(current.from || current.to);
  const hasFilters =
    current.search ||
    current.resource !== "all" ||
    current.status !== "all" ||
    current.actor ||
    current.action ||
    hasDateRange;

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const applyDateRange = () => {
    const from = fromRef.current?.value ?? "";
    const to = toRef.current?.value ?? "";
    const params = new URLSearchParams(searchParams.toString());
    if (from) params.set("from", from);
    else params.delete("from");
    if (to) params.set("to", to);
    else params.delete("to");
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const clearDateRange = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    params.delete("page");
    if (fromRef.current) fromRef.current.value = "";
    if (toRef.current) toRef.current.value = "";
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const clearAll = () => {
    if (fromRef.current) fromRef.current.value = "";
    if (toRef.current) toRef.current.value = "";
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* User email search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          defaultValue={current.search}
          placeholder={labels.search}
          className="h-8 pl-8 w-[180px] text-xs"
          onChange={(e) => {
            const v = e.target.value;
            const timer = setTimeout(() => update("search", v), 300);
            return () => clearTimeout(timer);
          }}
        />
      </div>

      {/* Actor email search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          defaultValue={current.actor}
          placeholder={labels.actor}
          className="h-8 pl-8 w-[180px] text-xs"
          onChange={(e) => {
            const v = e.target.value;
            const timer = setTimeout(() => update("actor", v), 300);
            return () => clearTimeout(timer);
          }}
        />
      </div>

      {/* Action keyword search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          defaultValue={current.action}
          placeholder={labels.action}
          className="h-8 pl-8 w-[160px] text-xs"
          onChange={(e) => {
            const v = e.target.value;
            const timer = setTimeout(() => update("action", v), 300);
            return () => clearTimeout(timer);
          }}
        />
      </div>

      {/* Resource filter */}
      <Select
        value={current.resource}
        onValueChange={(v) => update("resource", v)}
      >
        <SelectTrigger className="h-8 w-[150px] text-xs gap-1.5">
          <Filter className="size-3.5 text-muted-foreground shrink-0" />
          <SelectValue placeholder={labels.resource} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{labels.resource}</SelectItem>
          {resources.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select value={current.status} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue placeholder={labels.statusAll} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{labels.statusAll}</SelectItem>
          <SelectItem value="success">{labels.statusSuccess}</SelectItem>
          <SelectItem value="failed">{labels.statusFailed}</SelectItem>
        </SelectContent>
      </Select>

      {/* Date range picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-8 gap-1.5 text-xs ${hasDateRange ? "border-primary text-primary" : ""}`}
          >
            <Calendar className="size-3.5" />
            {hasDateRange
              ? `${current.from || "…"} → ${current.to || "…"}`
              : labels.dateRange}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">
                {labels.dateFrom}
              </label>
              <input
                ref={fromRef}
                type="date"
                defaultValue={current.from}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">
                {labels.dateTo}
              </label>
              <input
                ref={toRef}
                type="date"
                defaultValue={current.to}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 flex-1 text-xs"
                onClick={applyDateRange}
              >
                {labels.applyDateRange}
              </Button>
              {hasDateRange && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={clearDateRange}
                >
                  {labels.clearDateRange}
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear all filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-muted-foreground"
          onClick={clearAll}
        >
          <X className="size-3.5" />
          {labels.clearAll}
        </Button>
      )}

      {/* Export */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs ml-auto"
        onClick={() => window.open(exportHref, "_blank")}
      >
        <Download className="size-3.5" />
        {labels.export}
      </Button>
    </div>
  );
}
