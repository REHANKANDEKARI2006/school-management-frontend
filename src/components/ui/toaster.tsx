"use client"

import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

// Icon + color map per variant
const TOAST_CONFIG = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
  },
  destructive: {
    icon: XCircle,
    iconClass: "text-rose-600",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-600",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-600",
  },
  default: {
    icon: Info,
    iconClass: "text-muted-foreground",
  },
} as const

type ToastVariant = keyof typeof TOAST_CONFIG

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const v = (variant as ToastVariant) ?? "default"
        const cfg = TOAST_CONFIG[v] ?? TOAST_CONFIG.default
        const Icon = cfg.icon

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Variant Icon */}
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${cfg.iconClass}`} />
              {/* Content */}
              <div className="grid gap-0.5 flex-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
