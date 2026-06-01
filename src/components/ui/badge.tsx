import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        active: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/60 shadow-sm font-bold tracking-wide",
        completed: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/60 shadow-sm font-bold tracking-wide",
        inactive: "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100/60 shadow-sm font-bold tracking-wide",
        pending: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100/60 shadow-sm font-bold tracking-wide",
        approved: "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100/60 shadow-sm font-bold tracking-wide",
        rejected: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100/60 shadow-sm font-bold tracking-wide",
        draft: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100/60 shadow-sm font-bold tracking-wide",
        cancelled: "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200/60 shadow-sm font-bold tracking-wide",
        processing: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100/60 shadow-sm font-bold tracking-wide",
        expired: "border-amber-200 bg-amber-100/60 text-amber-800 hover:bg-amber-200/60 shadow-sm font-bold tracking-wide",
        published: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100/60 shadow-sm font-bold tracking-wide",
        unpublished: "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100/60 shadow-sm font-bold tracking-wide",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
