import React from "react";
import { DotSpinner } from "@/components/ui/dot-spinner";

export default function Loading() {
  return (
    <div className="w-full h-[80vh] flex flex-col items-center justify-center p-6 space-y-6">
      <DotSpinner />
      <p className="text-sm font-bold text-slate-500 tracking-wider uppercase animate-pulse">Loading...</p>
    </div>
  );
}
