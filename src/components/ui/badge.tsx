import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        // Default / system
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",

        // ── Active / Present / Paid / Completed → GREEN ──────────────────────
        active:
          "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]",
        completed:
          "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]",
        paid:
          "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]",
        present:
          "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]",

        // ── Pending / In Progress / Ongoing → AMBER ──────────────────────────
        pending:
          "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
        ongoing:
          "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",

        // ── Rejected / Absent / Overdue / Inactive / Deactivated → RED ───────
        rejected:
          "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
        inactive:
          "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
        overdue:
          "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
        absent:
          "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
        deactivated:
          "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",

        // ── Cancelled / Expired / Draft → GRAY ───────────────────────────────
        cancelled:
          "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]",
        expired:
          "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]",
        draft:
          "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]",

        // ── HOD Approved / Partial / Upcoming / Processing → BLUE ────────────
        approved:
          "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
        "hod-approved":
          "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
        partial:
          "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
        upcoming:
          "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
        published:
          "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
        processing:
          "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",

        // ── Warning / Expiring Soon / Unpublished → ORANGE ───────────────────
        warning:
          "bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]",
        "expiring-soon":
          "bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]",
        unpublished:
          "bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]",
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
