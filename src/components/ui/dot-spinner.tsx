import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DotSpinner({ className = "h-6 w-6 text-primary", style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <Loader2 className={cn("animate-spin text-primary shrink-0", className)} style={style} />
  );
}
