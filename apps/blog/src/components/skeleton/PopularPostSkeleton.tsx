import { Skeleton } from '@/components/ui/skeleton'

export default function PopularPostSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
      {/* Header with rank and views */}
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex items-center space-x-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>

      {/* Title */}
      <Skeleton className="h-6 w-5/6 mb-3" />

      {/* Description */}
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      {/* Meta info */}
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* Tags */}
      <div className="flex gap-2 mt-3">
        <Skeleton className="h-5 w-14 rounded-md" />
        <Skeleton className="h-5 w-18 rounded-md" />
      </div>
    </div>
  )
}