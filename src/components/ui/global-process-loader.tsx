"use client";

import React from "react";
import { useGlobalLoaderStore } from "@/store/useGlobalLoaderStore";
import { DotSpinner } from "@/components/ui/dot-spinner";
import { GraduationCap } from "lucide-react";

export function GlobalProcessLoader() {
  const { activeProcesses, message } = useGlobalLoaderStore();

  if (activeProcesses === 0) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 backdrop-blur-md transition-all duration-300 animate-in fade-in">
      <div className="w-[340px] max-w-[90vw] bg-white rounded-3xl shadow-2xl border border-slate-100/90 p-8 flex flex-col items-center text-center gap-5 animate-in zoom-in-95 duration-200">
        
        {/* Branding Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 shadow-2xs">
          <GraduationCap className="h-4 w-4 text-indigo-600" />
          <span className="text-[11px] font-extrabold tracking-widest text-indigo-700 uppercase">
            SchoolOS
          </span>
        </div>

        {/* Center Spinner */}
        <div className="py-2">
          <DotSpinner className="h-12 w-12 text-indigo-600" />
        </div>

        {/* Status Messages */}
        <div className="space-y-1.5 w-full">
          <h3 className="text-base font-bold text-slate-800 tracking-tight line-clamp-1">
            {message || "Processing..."}
          </h3>
          <p className="text-xs font-medium text-slate-400">
            Please wait, do not close the page
          </p>
        </div>

        {/* Bottom Accent Bar */}
        <div className="w-20 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500 rounded-full animate-pulse opacity-80" />
      </div>
    </div>
  );
}
