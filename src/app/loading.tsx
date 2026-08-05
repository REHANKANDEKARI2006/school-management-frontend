import React from "react";
import { DotSpinner } from "@/components/ui/dot-spinner";
import { GraduationCap } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50/70 p-6 selection:bg-indigo-500">
      <div className="w-[360px] max-w-[90vw] bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Branding Header */}
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 shadow-2xs">
          <GraduationCap className="h-4.5 w-4.5 text-indigo-600" />
          <span className="text-xs font-black tracking-widest text-indigo-700 uppercase">
            SchoolOS
          </span>
        </div>

        {/* Animated Dual-Ring Spinner */}
        <div className="py-3">
          <DotSpinner className="h-14 w-14 text-indigo-600" />
        </div>

        {/* Text Container */}
        <div className="space-y-1 w-full">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Loading System...
          </h3>
          <p className="text-xs font-medium text-slate-400">
            Initializing digital campus tools
          </p>
        </div>

        {/* Accent Bar */}
        <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500 rounded-full animate-pulse opacity-80" />
      </div>
    </div>
  );
}
