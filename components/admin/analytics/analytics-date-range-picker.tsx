"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type RangeOption = "7d" | "30d" | "90d";
const RANGES: RangeOption[] = ["7d", "30d", "90d"];

interface AnalyticsDateRangePickerProps {
  value: RangeOption;
}

export function AnalyticsDateRangePicker({
  value,
}: AnalyticsDateRangePickerProps) {
  const t = useTranslations("adminAnalytics.range");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setRange(range: RangeOption) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex items-center rounded-md border border-border bg-muted/40 p-0.5 gap-0.5">
      {RANGES.map((range) => (
        <button
          key={range}
          onClick={() => setRange(range)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded transition-colors",
            value === range
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(range)}
        </button>
      ))}
    </div>
  );
}
