"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, Filter, X, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditFiltersProps {
  resources: string[];
  labels: {
    search: string;
    resource: string;
    status: string;
    statusAll: string;
    statusSuccess: string;
    statusFailed: string;
    clearAll: string;
    export: string;
  };
  exportHref: string;
}

export function AuditFilters({ resources, labels, exportHref }: AuditFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const current = {
    search: searchParams.get("search") ?? "",
    resource: searchParams.get("resource") ?? "all",
    status: searchParams.get("status") ?? "all",
  };

  const hasFilters = current.search || current.resource !== "all" || current.status !== "all";

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // reset to page 1 on filter change
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          defaultValue={current.search}
          placeholder={labels.search}
          className="h-8 pl-8 w-[200px] text-xs"
          onChange={(e) => {
            const v = e.target.value;
            const timer = setTimeout(() => update("search", v), 300);
            return () => clearTimeout(timer);
          }}
        />
      </div>

      {/* Resource filter */}
      <Select
        value={current.resource}
        onValueChange={(v) => update("resource", v)}
      >
        <SelectTrigger className="h-8 w-[160px] text-xs gap-1.5">
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
      <Select
        value={current.status}
        onValueChange={(v) => update("status", v)}
      >
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue placeholder={labels.statusAll} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{labels.statusAll}</SelectItem>
          <SelectItem value="success">{labels.statusSuccess}</SelectItem>
          <SelectItem value="failed">{labels.statusFailed}</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear filters */}
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
