import React from "react";
import { DotSpinner } from "@/components/ui/dot-spinner";

export default function MainLoading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="w-[320px] max-w-[90vw] bg-white rounded-3xl p-8 border border-slate-200/80 shadow-lg flex flex-col items-center text-center gap-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Animated Dual-Ring Spinner */}
        <div className="py-2">
          <DotSpinner className="h-12 w-12 text-indigo-600" />
        </div>

        {/* Text Container */}
        <div className="space-y-1 w-full">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            Loading Content...
          </h3>
          <p className="text-xs font-medium text-slate-400">
            Fetching data, please wait
          </p>
        </div>

        {/* Accent Bar */}
        <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full animate-pulse opacity-80" />
      </div>
    </div>
  );
}
