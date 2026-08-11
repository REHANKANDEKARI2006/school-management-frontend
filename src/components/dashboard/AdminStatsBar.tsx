"use client";

import React from "react";
import { 
  Users, 
  GraduationCap, 
  UserSquare2, 
  ClipboardCheck, 
  IndianRupee 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsBarProps {
  stats?: {
    students: { total: number; newThisMonth: number };
    teachers: number;
    staff: number;
    attendance: { present: number; total: number; pendingClasses: number };
    feesMonth: number;
    totalFees?: number;
  };
  isHoliday?: boolean;
}

const renderSecondaryLabel = (label: string) => {
  if (!label) return null;
  
  if (label.startsWith("+") || label.match(/^\d/)) {
    const parts = label.split(" ");
    const percentOrNum = parts[0];
    const rest = parts.slice(1).join(" ");
    return (
      <p className="text-[10px] font-bold text-slate-400 leading-none select-none">
        <span className="text-emerald-500 font-extrabold mr-1">{percentOrNum}</span> {rest}
      </p>
    );
  }
  
  if (label.includes(" / ")) {
    const parts = label.split(" / ");
    const present = parts[0];
    const rest = parts[1];
    return (
      <p className="text-[10px] font-bold text-slate-400 leading-none select-none">
        <span className="text-emerald-500 font-extrabold">{present}</span> / {rest}
      </p>
    );
  }
  
  return (
    <p className="text-[10px] font-bold text-slate-400 leading-none select-none">
      {label}
    </p>
  );
};

const AdminStatsCard = ({ title, value, secondaryLabel, icon: Icon, iconColor, iconBg, className }: any) => {
  return (
    <Card className={cn("border border-slate-100/80 shadow-sm bg-white overflow-hidden rounded-2xl p-3 sm:p-5 flex flex-col justify-between h-full min-h-[100px] sm:min-h-[135px] hover:shadow-md transition-all duration-300", className)}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={cn("h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center border shrink-0", iconBg.replace("bg-", "border-").replace("50", "100"), iconBg)}>
          {Icon && <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", iconColor)} />}
        </div>
        <h3 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">{title}</h3>
      </div>
      <div className="mt-2 sm:mt-4 space-y-0.5 sm:space-y-1">
        <h2 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
          {typeof value === "number" ? value.toLocaleString() : value}
        </h2>
        {renderSecondaryLabel(secondaryLabel)}
      </div>
    </Card>
  );
};

export const AdminStatsBar = ({ stats, isHoliday }: StatsBarProps) => {
  const attendancePercentage = stats?.attendance.total 
    ? Math.round((stats.attendance.present / stats.attendance.total) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-5">
      <AdminStatsCard
        title="Total Students"
        value={stats?.students.total || 0}
        secondaryLabel={`+${stats?.students.newThisMonth || 0} new this month`}
        icon={Users}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
      />
      <AdminStatsCard
        title="Total Teachers"
        value={stats?.teachers || 0}
        secondaryLabel={`${stats?.teachers || 0} Active faculty`}
        icon={GraduationCap}
        iconColor="text-indigo-600"
        iconBg="bg-indigo-50"
      />
      <AdminStatsCard
        title="Total Staff"
        value={stats?.staff || 0}
        secondaryLabel="Non-teaching"
        icon={UserSquare2}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
      />
      <AdminStatsCard
        title="Today's Attendance"
        value={isHoliday ? (new Date().getDay() === 0 ? "Sunday" : "Holiday") : `${attendancePercentage}%`}
        secondaryLabel={isHoliday ? "School Closed" : `${stats?.attendance.present ?? 0} / ${stats?.attendance.total ?? 0} present`}
        icon={ClipboardCheck}
        iconColor={isHoliday ? "text-orange-600" : "text-amber-600"}
        iconBg="bg-amber-50"
      />
      <AdminStatsCard
        title="Fees Collected"
        value={`₹${(stats?.feesMonth || 0).toLocaleString()}`}
        secondaryLabel={`₹${(stats?.totalFees || 0).toLocaleString()} Collected total`}
        icon={IndianRupee}
        iconColor="text-rose-600"
        iconBg="bg-rose-50"
      />
    </div>
  );
};
