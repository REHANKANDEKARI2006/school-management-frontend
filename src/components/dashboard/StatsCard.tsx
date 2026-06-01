"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  secondaryLabel?: React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  className?: string;
}

export const StatsCard = ({ 
  title, 
  value, 
  secondaryLabel, 
  icon: Icon,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-50",
  className 
}: StatsCardProps) => {
  return (
    <Card className={cn("border border-slate-100/80 shadow-sm bg-white overflow-hidden rounded-2xl hover:shadow-md transition-all duration-300", className)}>
      <CardContent className="p-5 flex flex-col justify-between h-full min-h-[140px]">
        {/* TOP ROW: Icon + Tag */}
        <div className="flex items-center gap-3">
          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center border", iconBg.replace("bg-", "border-").replace("50", "100"), iconBg)}>
            {Icon && <Icon className={cn("h-4 w-4", iconColor)} />}
          </div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
        </div>

        {/* BOTTOM CONTENT: Value + Labels */}
        <div className="space-y-1 mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              {typeof value === "number" ? value.toLocaleString() : value}
            </span>
          </div>
          {secondaryLabel && (
            <div className="space-y-0.5">
              {typeof secondaryLabel === "string" && secondaryLabel.includes(" — ") ? (
                <>
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide truncate">
                    {secondaryLabel.split(" — ")[0]}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                    {secondaryLabel.split(" — ")[1]}
                  </p>
                </>
              ) : (
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight leading-tight">
                  {secondaryLabel}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
