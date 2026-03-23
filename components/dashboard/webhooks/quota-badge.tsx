import { cn } from "@/lib/utils";

interface QuotaBadgeProps {
  used: number;
  max: number | null;
  label: string; // e.g. "{used} of {max} webhooks used"
}

export function QuotaBadge({ used, max, label }: QuotaBadgeProps) {
  const atLimit = max !== null && used >= max;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        atLimit
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}
