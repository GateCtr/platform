"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Snapshot {
  total: number;
  last1h: number;
  bySource: Record<string, number>;
  timestamp: string;
}

export function LiveCounter({ initialTotal }: { initialTotal: number }) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const es = new EventSource("/api/admin/launch/stream");

    es.onmessage = (e) => {
      try {
        const snapshot = JSON.parse(e.data as string) as Snapshot;
        setData((prev) => {
          if (prev && snapshot.total > prev.total) {
            setPulse(true);
            setTimeout(() => setPulse(false), 1000);
          }
          return snapshot;
        });
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, []);

  const total = data?.total ?? initialTotal;
  const last1h = data?.last1h ?? 0;
  const ph = data?.bySource?.producthunt ?? 0;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "relative flex size-2",
            data ? "opacity-100" : "opacity-40",
          )}
        >
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75",
              !pulse && "hidden",
            )}
          />
          <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
        </span>
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {total.toLocaleString()}
        </span>
        <span className="text-sm text-muted-foreground">signups</span>
      </div>

      {last1h > 0 && (
        <Badge
          variant="outline"
          className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        >
          +{last1h} last hour
        </Badge>
      )}

      {ph > 0 && (
        <Badge
          variant="outline"
          className="text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
        >
          🚀 {ph} from PH
        </Badge>
      )}
    </div>
  );
}
