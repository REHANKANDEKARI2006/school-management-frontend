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
  };
  isHoliday?: boolean;
}

const renderSecondaryLabel = (label: string) => {
  if (!label) return null;
  
  if (label.startsWith("+")) {
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

const AdminStatsCard = ({ title, value, secondaryLabel, icon: Icon, iconColor, iconBg }: any) => {
  return (
    <Card className="border border-slate-100/80 shadow-sm bg-white overflow-hidden rounded-2xl p-5 flex flex-col justify-between h-full min-h-[135px] hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center border", iconBg.replace("bg-", "border-").replace("50", "100"), iconBg)}>
          {Icon && <Icon className={cn("h-4 w-4", iconColor)} />}
        </div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="mt-4 space-y-1">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
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
        secondaryLabel="+3 Active faculty"
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
        secondaryLabel={isHoliday ? "School Closed" : `${stats?.attendance.present || 572} / ${stats?.attendance.total || 618} present`}
        icon={ClipboardCheck}
        iconColor={isHoliday ? "text-orange-600" : "text-amber-600"}
        iconBg={isHoliday ? "bg-orange-50" : "bg-amber-50"}
      />
      <AdminStatsCard
        title="Fees Collected"
        value={`₹${(stats?.feesMonth || 0).toLocaleString()}`}
        secondaryLabel="+12.5% Collected total"
        icon={IndianRupee}
        iconColor="text-rose-600"
        iconBg="bg-rose-50"
      />
    </div>
  );
};
