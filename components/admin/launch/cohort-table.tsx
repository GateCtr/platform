import type { CohortRow } from "@/lib/actions/launch";
import { cn } from "@/lib/utils";

interface Props {
  data: CohortRow[];
}

function retentionColor(pct: number): string {
  if (pct < 0) return "bg-muted/30 text-muted-foreground";
  if (pct >= 60)
    return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400";
  if (pct >= 30) return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-muted/40 text-muted-foreground";
}

export function CohortTable({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No cohort data yet — check back after the first week.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap">
              Week
            </th>
            <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap">
              Source
            </th>
            <th className="text-right px-4 py-3 font-semibold text-foreground whitespace-nowrap">
              Signups
            </th>
            <th className="text-center px-4 py-3 font-semibold text-foreground whitespace-nowrap">
              Week +1
            </th>
            <th className="text-center px-4 py-3 font-semibold text-foreground whitespace-nowrap">
              Week +2
            </th>
            <th className="text-center px-4 py-3 font-semibold text-foreground whitespace-nowrap">
              Week +4
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={`${row.week}-${row.source}`}
              className={cn(
                "border-b border-border last:border-0",
                i % 2 === 0 ? "bg-card" : "bg-muted/10",
              )}
            >
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {row.week}
              </td>
              <td className="px-4 py-3 font-medium capitalize">{row.source}</td>
              <td className="px-4 py-3 text-right tabular-nums font-semibold">
                {row.signups}
              </td>
              {row.retention.map((pct, j) => (
                <td key={j} className="px-4 py-3 text-center">
                  {pct < 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <span
                      className={cn(
                        "inline-block rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
                        retentionColor(pct),
                      )}
                    >
                      {pct}%
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
