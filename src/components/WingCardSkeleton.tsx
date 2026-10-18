export function WingCardSkeleton() {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-800 animate-pulse">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-10" />
          </div>
          {/* Content lines */}
          <div className="mt-3 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/6" />
          </div>
          {/* Action row */}
          <div className="mt-4 flex items-center justify-between max-w-md">
            <div className="h-4 w-8 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-8 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-8 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-8 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}