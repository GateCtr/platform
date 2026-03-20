import { Skeleton } from "@/components/ui/skeleton";

export default function WaitlistLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-5 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-12" />
            </div>
            <Skeleton className="size-10 rounded-lg shrink-0" />
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3.5 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-40 rounded-md" />
          </div>
        </div>
        <div className="bg-muted/40 px-4 py-3 grid grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-3 grid grid-cols-6 gap-4 border-t border-border items-center">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-10 rounded-full" />
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-7 rounded-md shrink-0" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
