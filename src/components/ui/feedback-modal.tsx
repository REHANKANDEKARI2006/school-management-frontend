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
          "w-[calc(100vw-32px)] max-w-[380px] rounded-2xl border border-slate-200/90 shadow-xl bg-white p-5 space-y-0",
          "animate-in fade-in zoom-in-95 duration-200"
        )}
      >
        {/* Icon */}
        <div className="flex justify-center pt-2 pb-3">
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
        <DialogHeader className="space-y-1.5 text-center px-1 pb-3">
          <DialogTitle className="text-center text-sm sm:text-lg font-black text-slate-900 tracking-tight leading-snug whitespace-nowrap">
            {state.title}
          </DialogTitle>
          {state.message && (
            <DialogDescription className="text-center text-xs font-medium text-slate-500 leading-relaxed">
              {state.message}
            </DialogDescription>
          )}
          {state.detail && (
            <p className="text-[11px] text-slate-400 text-center mt-1 leading-relaxed">
              {state.detail}
            </p>
          )}
        </DialogHeader>

        {/* Actions - Side-by-side 2-column row */}
        <DialogFooter className="grid grid-cols-2 gap-2.5 w-full pt-2">
          {cfg.showCancel && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={confirming}
              className="w-full h-11 rounded-2xl font-bold text-xs border-2 border-slate-200/90 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
            >
              {state.cancelText ?? cfg.defaultCancelText}
            </Button>
          )}
          <Button
            variant={cfg.confirmVariant}
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full h-11 rounded-2xl font-bold text-xs gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            {state.confirmText ?? cfg.defaultConfirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
