import { Skeleton } from "@/components/ui/skeleton"
import { DotSpinner } from "@/components/ui/dot-spinner"
import { TableRow, TableCell } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Uniform skeleton loader used across all pages.
 * Replaced with a centralized global dot spinner per system design requirements.
 */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center p-6 space-y-6">
      <DotSpinner />
      <p className="text-sm font-bold text-slate-500 tracking-wider uppercase animate-pulse">Loading...</p>
    </div>
  )
}

/**
 * Inline table skeleton — renders directly inside <TableBody>.
 * Replaces the old pattern of <PageSkeleton> inside a single <TableCell>.
 */
export function TableSkeleton({
  cols = 5,
  rows = 5,
}: {
  cols?: number;
  rows?: number;
}) {
  return (
    <>
      {Array(rows)
        .fill(0)
        .map((_, i) => (
          <TableRow key={i} className="hover:bg-transparent">
            {Array(cols)
              .fill(0)
              .map((_, j) => (
                <TableCell key={j}>
                  <Skeleton
                    className={`h-4 rounded-md ${
                      j === 0
                        ? "w-32"
                        : j === cols - 1
                        ? "w-16"
                        : j === 1
                        ? "w-28"
                        : "w-20"
                    } animate-pulse`}
                  />
                </TableCell>
              ))}
          </TableRow>
        ))}
    </>
  )
}

/**
 * Stat card skeleton — use inside a grid to show loading placeholders
 * for dashboard stat cards while data is fetching.
 */
export function StatCardSkeleton() {
  return (
    <Card className="border-none bg-background/60 shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-8 w-14 rounded-md" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Card grid skeleton — for dashboard widgets and module overviews.
 */
export function CardGridSkeleton({
  count = 4,
  cols = 4,
}: {
  count?: number;
  cols?: 2 | 3 | 4;
}) {
  const colClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  }[cols];

  return (
    <div className={`grid ${colClass} gap-4`}>
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <StatCardSkeleton key={i} />
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
