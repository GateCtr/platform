import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <div className="w-full max-w-md space-y-8">
      {/* Progress bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-1.5 flex-1 rounded-full" />
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
        {/* Card header */}
        <div className="border-b border-border px-6 py-5 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Card body */}
        <div className="px-6 py-6 space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2">
        <Skeleton className="h-2 w-6 rounded-full" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-2 w-2 rounded-full" />
        ))}
      </div>
    </div>
  );
}
