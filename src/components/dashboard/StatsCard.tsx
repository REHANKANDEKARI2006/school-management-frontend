"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "bg-white rounded-[12px] p-5 flex flex-col border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-xl", iconBg)}>
          {Icon && <Icon className={cn("h-5 w-5", iconColor)} />}
        </div>
      </div>
      <div className="space-y-1">
        <h1 className="text-[32px] font-bold text-slate-900 tracking-tight leading-none">
          {typeof value === "number" ? value.toLocaleString() : value}
        </h1>
        <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</h2>
        </div>
        {secondaryLabel && (
          <div className="text-xs font-medium text-slate-400 mt-1">
            {secondaryLabel}
          </div>
        )}
      </div>
    </motion.div>
  );
};
