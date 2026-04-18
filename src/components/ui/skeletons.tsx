import { Skeleton } from "@/components/ui/skeleton"

/**
 * Uniform skeleton loader used across all pages.
 * Matches the product-card shimmer style: image placeholder + text lines + detail section.
 * Renders `rows` repeating skeleton items inside a Card-like container.
 */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-4 p-6">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-5 rounded-lg border border-border/40 bg-card p-5">
      {/* Image / Avatar placeholder */}
      <Skeleton className="h-[72px] w-[72px] shrink-0 rounded-lg" />

      {/* Text lines */}
      <div className="flex-1 space-y-2.5 pt-1">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>

      {/* Detail / Price section */}
      <div className="hidden sm:flex shrink-0 flex-col items-end gap-2 pt-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export { SkeletonRow }
