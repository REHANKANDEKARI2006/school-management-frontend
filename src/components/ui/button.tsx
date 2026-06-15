import * as React from "react"
import { Loader2 } from "lucide-react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // PRIMARY — blue bg, white text, darker on hover, scale on active
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/85 active:scale-[0.98]",
        // DANGER — red bg, white text
        destructive:
          "bg-[#ef4444] text-white shadow-sm hover:bg-[#dc2626] active:scale-[0.98]",
        // SECONDARY — white/transparent bg, primary border + text
        outline:
          "border border-primary/50 bg-background text-primary shadow-sm hover:bg-primary/8 hover:border-primary active:scale-[0.98]",
        // SECONDARY (muted) — gray bg, dark text
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/70 active:scale-[0.98]",
        // GHOST — transparent, very light hover
        ghost:
          "hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]",
        // LINK — text only
        link: "text-primary underline-offset-4 hover:underline",
        // SUCCESS — emerald/green
        success:
          "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98]",
        // WARNING — amber
        warning:
          "bg-amber-500 text-white shadow-sm hover:bg-amber-600 active:scale-[0.98]",
        // NEUTRAL — light gray, subtle border
        neutral:
          "bg-slate-100 text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-200 active:scale-[0.98]",
        // DANGER GHOST — ghost variant for danger actions (e.g. cancel in list)
        "ghost-danger":
          "text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:scale-[0.98]",
        // OUTLINE DANGER — secondary danger (reject, decline)
        "outline-danger":
          "border border-rose-300 bg-background text-rose-600 shadow-sm hover:bg-rose-50 hover:border-rose-400 active:scale-[0.98]",
        // OUTLINE SUCCESS — secondary success (approve, accept)
        "outline-success":
          "border border-emerald-300 bg-background text-emerald-700 shadow-sm hover:bg-emerald-50 hover:border-emerald-400 active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8",
        icon: "h-9 w-9",
        xs: "h-7 rounded-md px-2.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || disabled}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
