"use client";

import { StatsCard } from "./StatsCard";
import { 
  Users, 
  GraduationCap, 
  UserSquare2, 
  ClipboardCheck, 
  IndianRupee 
} from "lucide-react";

interface StatsBarProps {
  stats?: {
    students: { total: number; newThisMonth: number };
    teachers: number;
    staff: number;
    attendance: { present: number; total: number; pendingClasses: number };
    feesMonth: number;
  };
}

export const StatsBar = ({ stats }: StatsBarProps) => {
  const attendancePercentage = stats?.attendance.total 
    ? Math.round((stats.attendance.present / stats.attendance.total) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
      <StatsCard
        title="Total Students"
        value={stats?.students.total || 0}
        secondaryLabel={`+${stats?.students.newThisMonth || 0} new this month`}
        icon={Users}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
      />
      <StatsCard
        title="Total Teachers"
        value={stats?.teachers || 0}
        secondaryLabel="Active faculty"
        icon={GraduationCap}
        iconColor="text-indigo-600"
        iconBg="bg-indigo-50"
      />
      <StatsCard
        title="Total Staff"
        value={stats?.staff || 0}
        secondaryLabel="Non-teaching"
        icon={UserSquare2}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
      />
      <StatsCard
        title="Today's Attendance"
        value={`${attendancePercentage}%`}
        secondaryLabel={stats?.attendance.pendingClasses ? `${stats.attendance.pendingClasses} classes pending` : "All classes marked"}
        icon={ClipboardCheck}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
      />
      <StatsCard
        title="Fees This Month"
        value={`₹${(stats?.feesMonth || 0).toLocaleString()}`}
        secondaryLabel="Collected total"
        icon={IndianRupee}
        iconColor="text-rose-600"
        iconBg="bg-rose-50"
      />
    </div>
  );
};
