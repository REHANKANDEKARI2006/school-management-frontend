"use client";

import { StatsCard } from "./StatsCard";
import { 
  BookOpen, 
  ClipboardCheck, 
  FileEdit, 
  CalendarClock,
  ShieldCheck
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface TeacherStatsBarProps {
  stats?: {
    totalClassesToday: number;
    attendancePending: number;
    marksPending: number;
    nextExam?: { name: string; date: string } | null;
  };
  classTeacherOf?: {
    className: string;
    sectionName: string;
  } | null;
  profile?: {
    user_status_id: number;
    status_name: string;
  } | null;
}

export const TeacherStatsBar = ({ stats, classTeacherOf, profile }: TeacherStatsBarProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {classTeacherOf && (
          <div className="flex items-center gap-3 animate-in slide-in-from-left duration-500">
             <div className="bg-blue-600/10 p-2 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
             </div>
             <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Designation</p>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  Class Teacher of {classTeacherOf.className} - {classTeacherOf.sectionName}
                  <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 text-[9px] uppercase font-bold py-0 h-4">
                    Official
                  </Badge>
                </h3>
             </div>
          </div>
        )}

        {profile && (
          <div className="flex items-center gap-2 ml-auto">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status:</span>
             <Badge className={`uppercase text-[10px] font-black px-3 py-1 rounded-full border-none shadow-sm ${
                profile.user_status_id === 1 ? "bg-emerald-500 text-white" :
                profile.user_status_id === 7 ? "bg-rose-500 text-white animate-pulse" :
                profile.user_status_id === 8 ? "bg-amber-500 text-white" : "bg-slate-500 text-white"
             }`}>
               {profile.status_name}
             </Badge>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Today's Classes"
          value={stats?.totalClassesToday || 0}
          secondaryLabel="Scheduled sessions today"
          icon={BookOpen}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Attendance Pending"
          value={stats?.attendancePending || 0}
          secondaryLabel={stats?.attendancePending === 0 ? "All marked" : "Classes to mark"}
          icon={ClipboardCheck}
          iconColor={stats?.attendancePending === 0 ? "text-emerald-600" : "text-amber-600"}
          iconBg={stats?.attendancePending === 0 ? "bg-emerald-50" : "bg-amber-50"}
        />
        <StatsCard
          title="Marks Pending"
          value={stats?.marksPending || 0}
          secondaryLabel="Exams/Tasks pending entry"
          icon={FileEdit}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <StatsCard
          title="Next Exam"
          value={stats?.nextExam ? stats.nextExam.name : "No upcoming exams"}
          secondaryLabel={stats?.nextExam ? format(new Date(stats.nextExam.date), "MMM dd, yyyy") : "Clean schedule"}
          icon={CalendarClock}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
      </div>
    </div>
  );
};
