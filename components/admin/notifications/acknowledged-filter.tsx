"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type AcknowledgedOption = "all" | "unacknowledged" | "acknowledged";

const OPTIONS: AcknowledgedOption[] = ["all", "unacknowledged", "acknowledged"];

export function AcknowledgedFilter() {
  const t = useTranslations("adminNotifications.filters");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = (searchParams.get("acknowledged") ??
    "all") as AcknowledgedOption;

  function handleSelect(value: AcknowledgedOption) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("acknowledged");
    } else {
      params.set("acknowledged", value === "acknowledged" ? "true" : "false");
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
            "data-[active=true]:bg-foreground data-[active=true]:text-background",
          )}
        >
          {t(opt)}
        </button>
      ))}
    </div>
  );
}
