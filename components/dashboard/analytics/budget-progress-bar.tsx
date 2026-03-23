import { cn } from "@/lib/utils";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";

interface BudgetProgressBarProps {
  tokensPct: number;
  alertThresholdPct: number;
  limitReachedLabel: string;
  label?: string;
  tokensUsed?: number;
  tokensLimit?: number;
}

export function BudgetProgressBar({
  tokensPct,
  alertThresholdPct,
  limitReachedLabel,
  label,
  tokensUsed,
  tokensLimit,
}: BudgetProgressBarProps) {
  const clamped = Math.min(tokensPct, 100);
  const isAtLimit = tokensPct >= 100;
  const isWarning = !isAtLimit && tokensPct >= alertThresholdPct;

  const color = isAtLimit
    ? "bg-red-500"
    : isWarning
      ? "bg-amber-500"
      : "bg-emerald-500";

  const trackColor = isAtLimit
    ? "bg-red-500/10"
    : isWarning
      ? "bg-amber-500/10"
      : "bg-muted";

  const textColor = isAtLimit
    ? "text-red-500"
    : isWarning
      ? "text-amber-500"
      : "text-emerald-600 dark:text-emerald-400";

  const StatusIcon = isAtLimit
    ? ShieldAlert
    : isWarning
      ? AlertTriangle
      : ShieldCheck;

  return (
    <div className="flex items-center gap-5">
      {/* Icon */}
      <div
        className={cn(
          "shrink-0 p-2.5 rounded-lg",
          isAtLimit
            ? "bg-red-500/10"
            : isWarning
              ? "bg-amber-500/10"
              : "bg-emerald-500/10",
        )}
      >
        <StatusIcon className={cn("size-5", textColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">{label}</span>
          <span
            className={cn("text-sm font-bold tabular-nums shrink-0", textColor)}
          >
            {tokensPct}%
          </span>
        </div>

        {/* Track */}
        <div
          className={cn("h-2 w-full rounded-full overflow-hidden", trackColor)}
        >
          {/* Alert threshold marker */}
          <div className="relative h-full">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                color,
              )}
              style={{ width: `${clamped}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          {tokensUsed !== undefined && tokensLimit !== undefined ? (
            <span className="tabular-nums">
              {tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()}{" "}
              tokens
            </span>
          ) : (
            <span>
              {isAtLimit
                ? limitReachedLabel
                : isWarning
                  ? `Alert at ${alertThresholdPct}%`
                  : `Threshold: ${alertThresholdPct}%`}
            </span>
          )}
          <span className="tabular-nums">{100 - clamped}% remaining</span>
        </div>
      </div>
    </div>
  );
}
