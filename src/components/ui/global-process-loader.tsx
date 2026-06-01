"use client";

import React from "react";
import { useGlobalLoaderStore } from "@/store/useGlobalLoaderStore";
import { DotSpinner } from "@/components/ui/dot-spinner";

export function GlobalProcessLoader() {
  const { activeProcesses, message } = useGlobalLoaderStore();

  if (activeProcesses === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-all duration-300 animate-in fade-in duration-200">
      <div className="bg-background rounded-2xl shadow-2xl border border-border/50 flex flex-col items-center gap-5 px-10 py-8 min-w-[220px] animate-in zoom-in-95 duration-200">

        {/* Branding */}
        <div className="text-xs font-black tracking-[0.25em] uppercase text-muted-foreground/60 select-none">
          CampusConnect
        </div>

        {/* Spinner */}
        <DotSpinner />

        {/* Contextual message */}
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground/80 animate-pulse">
            {message || "Processing…"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Please wait, do not close the page
          </p>
        </div>
      </div>
    </div>
  );
}
