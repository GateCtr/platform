import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLogsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="bg-muted/40 px-4 py-3 grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="px-4 py-3 grid grid-cols-5 gap-4 border-t border-border items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24 font-mono" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
