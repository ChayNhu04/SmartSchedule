import { Skeleton } from "@/components/ui/skeleton";

export function ScheduleCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 pl-5">
      <div className="absolute inset-y-0 left-0 w-1 bg-muted" />
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="mb-4 h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function ScheduleListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ScheduleCardSkeleton key={i} />
      ))}
    </div>
  );
}
