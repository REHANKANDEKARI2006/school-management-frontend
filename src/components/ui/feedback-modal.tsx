"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeedbackType = "success" | "error" | "warning" | "confirm" | "info";

export interface FeedbackModalState {
  open: boolean;
  type: FeedbackType;
  title: string;
  message?: string;
  detail?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
}

// ─── Visual Config ────────────────────────────────────────────────────────────

interface TypeConfig {
  icon: React.ElementType;
  iconBg: string;
  iconRing: string;
  iconColor: string;
  defaultConfirmText: string;
  defaultCancelText: string;
  showCancel: boolean;
  confirmVariant: "default" | "destructive" | "outline";
}

const CONFIG: Record<FeedbackType, TypeConfig> = {
  success: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconRing: "ring-emerald-100",
    iconColor: "text-emerald-600",
    defaultConfirmText: "Continue",
    defaultCancelText: "Close",
    showCancel: false,
    confirmVariant: "default",
  },
  error: {
    icon: XCircle,
    iconBg: "bg-rose-50",
    iconRing: "ring-rose-100",
    iconColor: "text-rose-600",
    defaultConfirmText: "Try Again",
    defaultCancelText: "Close",
    showCancel: false,
    confirmVariant: "destructive",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50",
    iconRing: "ring-amber-100",
    iconColor: "text-amber-600",
    defaultConfirmText: "Proceed",
    defaultCancelText: "Cancel",
    showCancel: true,
    confirmVariant: "destructive",
  },
  confirm: {
    icon: Info,
    iconBg: "bg-blue-50",
    iconRing: "ring-blue-100",
    iconColor: "text-blue-600",
    defaultConfirmText: "Confirm",
    defaultCancelText: "Cancel",
    showCancel: true,
    confirmVariant: "default",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-50",
    iconRing: "ring-blue-100",
    iconColor: "text-blue-600",
    defaultConfirmText: "OK",
    defaultCancelText: "Close",
    showCancel: false,
    confirmVariant: "default",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface FeedbackModalProps {
  state: FeedbackModalState;
  onDismiss: () => void;
}

export function FeedbackModal({ state, onDismiss }: FeedbackModalProps) {
  const [confirming, setConfirming] = React.useState(false);

  const cfg = CONFIG[state.type];
  const Icon = cfg.icon;

  const handleConfirm = async () => {
    if (state.onConfirm) {
      try {
        setConfirming(true);
        await state.onConfirm();
      } finally {
        setConfirming(false);
      }
    }
    state.onClose?.();
    onDismiss();
  };

  const handleCancel = () => {
    state.onCancel?.();
    state.onClose?.();
    onDismiss();
  };

  return (
    <Dialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
    >
      <DialogContent
        className={cn(
          "sm:max-w-[380px] rounded-2xl border-none shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-200"
        )}
      >
        {/* Icon */}
        <div className="flex justify-center pt-4 pb-2">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center ring-8",
              cfg.iconBg,
              cfg.iconRing
            )}
          >
            <Icon className={cn("w-8 h-8", cfg.iconColor)} />
          </div>
        </div>

        {/* Title & Message */}
        <DialogHeader className="space-y-2 text-center px-2">
          <DialogTitle className="text-center text-lg font-bold leading-tight">
            {state.title}
          </DialogTitle>
          {state.message && (
            <DialogDescription className="text-center text-sm leading-relaxed text-muted-foreground">
              {state.message}
            </DialogDescription>
          )}
          {state.detail && (
            <p className="text-xs text-muted-foreground/70 text-center mt-1 leading-relaxed">
              {state.detail}
            </p>
          )}
        </DialogHeader>

        {/* Actions */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-center pb-2 mt-1">
          {cfg.showCancel && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={confirming}
              className="sm:w-28 rounded-xl"
            >
              {state.cancelText ?? cfg.defaultCancelText}
            </Button>
          )}
          <Button
            variant={cfg.confirmVariant}
            onClick={handleConfirm}
            disabled={confirming}
            className="sm:w-28 rounded-xl gap-1.5"
          >
            {confirming && <Loader2 className="w-4 h-4 animate-spin" />}
            {state.confirmText ?? cfg.defaultConfirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
