import { Skeleton } from "@/components/ui/skeleton"
import { DotSpinner } from "@/components/ui/dot-spinner"
import { TableRow, TableCell } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Uniform skeleton loader used across all pages.
 * Renders row-shaped placeholders matching typical page content layout.
 */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-6 p-1 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      {/* Stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      {/* Content rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({
  cols = 5,
  rows = 5,
}: {
  cols?: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <TableRow key={rowIdx}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <TableCell key={colIdx} className="py-3">
              <Skeleton className="h-4 w-full rounded-md" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="rounded-2xl border-slate-100/80 shadow-sm bg-white overflow-hidden">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-3 w-28 rounded-md" />
      </CardContent>
    </Card>
  );
}

export function CardGridSkeleton({
  count = 4,
  cols = 4,
}: {
  count?: number;
  cols?: 2 | 3 | 4;
}) {
  const gridClass =
    cols === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : cols === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={`grid ${gridClass} gap-4 animate-in fade-in duration-300`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="rounded-2xl border-slate-100/80 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-8 w-1/2 rounded-md" />
            <Skeleton className="h-3 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell colSpan={100}>
        <Skeleton className="h-10 w-full rounded-lg" />
      </TableCell>
    </TableRow>
  );
}

export { SkeletonRow }
