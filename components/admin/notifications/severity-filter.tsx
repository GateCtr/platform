"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type SeverityOption = "all" | "critical" | "warning" | "info";

const OPTIONS: SeverityOption[] = ["all", "critical", "warning", "info"];

const OPTION_CLASS: Record<SeverityOption, string> = {
  all: "data-[active=true]:bg-foreground data-[active=true]:text-background",
  critical:
    "data-[active=true]:bg-destructive data-[active=true]:text-destructive-foreground",
  warning: "data-[active=true]:bg-amber-500 data-[active=true]:text-white",
  info: "data-[active=true]:bg-blue-500 data-[active=true]:text-white",
};

export function SeverityFilter() {
  const t = useTranslations("adminNotifications.filters");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = (searchParams.get("severity") ?? "all") as SeverityOption;

  function handleSelect(value: SeverityOption) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("severity");
    } else {
      params.set("severity", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          data-active={current === opt}
          onClick={() => handleSelect(opt)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            "text-muted-foreground hover:text-foreground",
            OPTION_CLASS[opt],
          )}
        >
          {t(opt)}
        </button>
      ))}
    </div>
  );
}
