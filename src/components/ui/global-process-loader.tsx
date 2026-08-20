"use client";

import React from "react";
import { useGlobalLoaderStore } from "@/store/useGlobalLoaderStore";
import { Loader2 } from "lucide-react";

export function GlobalProcessLoader() {
  const { activeProcesses, message } = useGlobalLoaderStore();

  if (activeProcesses <= 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 bg-white rounded-2xl p-8 shadow-2xl border border-slate-200/80 max-w-[90vw] w-[320px] animate-in fade-in zoom-in-95 duration-200">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-slate-800">
            {message || "Processing…"}
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            Please wait while we complete this operation
          </p>
        </div>
      </div>
    </div>
  );
}
