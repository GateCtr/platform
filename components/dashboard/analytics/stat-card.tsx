import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: number; // positive = up, negative = down
  unit?: string;
}

export function StatCard({ label, value, delta, unit }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-semibold tabular-nums">
        {value}
        {unit && (
          <span className="text-sm font-normal text-muted-foreground ml-1">
            {unit}
          </span>
        )}
      </p>
      {delta !== undefined && (
        <p
          className={cn(
            "text-xs font-medium",
            delta >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500",
          )}
        >
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)}%
        </p>
      )}
    </div>
  );
}
