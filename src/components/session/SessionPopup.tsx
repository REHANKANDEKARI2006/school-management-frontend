"use client";

import { Clock, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SessionPopup({
  countdown,
  onContinue,
  onLogout,
}: {
  countdown: number;
  onContinue: () => void;
  onLogout: () => void;
}) {
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const progress = (countdown / 120) * 100; // 120 = POPUP_COUNTDOWN

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background rounded-3xl shadow-2xl border border-border/50 w-full max-w-[360px] sm:max-w-[400px] overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Progress bar at top */}
        <div className="h-1.5 w-full bg-muted">
          <div
            className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6 sm:p-8 text-center">
          {/* Icon */}
          <div className="bg-amber-100 dark:bg-amber-950/50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-foreground mb-2">
            Session Expiring Soon
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 leading-relaxed">
            You&apos;ve been inactive for a while. Your session will expire in:
          </p>

          {/* Countdown */}
          <div className="text-4xl font-black text-amber-600 dark:text-amber-500 tabular-nums my-3 sm:my-4 tracking-wide">
            {timeStr}
          </div>

          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
            Click &quot;Continue&quot; to stay logged in, or you will be signed out automatically.
          </p>

          {/* Buttons */}
          <div className="flex gap-2.5 sm:gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-xl"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign Out
            </Button>
            <Button
              className="flex-1 h-11 gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold rounded-xl"
              onClick={onContinue}
            >
              <RefreshCw className="h-4 w-4 shrink-0" />
              Continue Session
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
