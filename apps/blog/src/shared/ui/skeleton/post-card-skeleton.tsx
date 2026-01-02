import { Skeleton } from '@/shared/ui/skeleton';

export default function PostCardSkeleton() {
  return (
    <div className="py-4 space-y-2">
      {/* Title skeleton */}
      <Skeleton className="h-6 w-3/4" />

      {/* Description skeleton */}
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Meta info skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-14" />
      </div>
    </div>
  );
}
