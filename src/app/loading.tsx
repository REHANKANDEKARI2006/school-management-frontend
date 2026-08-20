import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50/60 p-6">
      <div className="flex flex-col items-center justify-center gap-3 text-center animate-in fade-in duration-300">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Loading SchoolOS…
        </p>
      </div>
    </div>
  );
}
