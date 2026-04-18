"use client";

import { StatsCard } from "./StatsCard";
import { 
  UserCircle, 
  CreditCard, 
  BookOpen, 
  CalendarClock,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TimetableEntry {
  start_time: string;
  end_time: string;
  period_number: number;
  subject_name: string;
  teacher_name: string;
}

interface StudentStatsBarProps {
  profile: {
    name: string;
    class: string;
    section: string;
    rollNo: string;
    photo: string;
  };
  stats: {
    todayAttendance: string;
    pendingFees: number;
    pendingHomework: number;
    nextExam: string;
    nextExamDate: string | null;
  };
  timetable: TimetableEntry[];
}

export const StudentStatsBar = ({ profile, stats, timetable }: StudentStatsBarProps) => {
  const getExamCountdown = (date: string | null) => {
    if (!date) return "No upcoming exams";
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 3600 * 24));
    if (diff < 0) return "Exam in progress";
    if (diff === 0) return "Exam today!";
    return `${diff} ${diff === 1 ? 'day' : 'days'} remaining`;
  };

  const getNextClassInfo = () => {
    if (!timetable || timetable.length === 0) return { status: 'none', value: 'No Classes', label: 'No classes scheduled today', iconColor: 'text-slate-400', iconBg: 'bg-slate-50' };

    const now = new Date();
    const currentTimeStr = format(now, "HH:mm:ss");

    // Ongoing class
    const ongoing = timetable.find(c => currentTimeStr >= c.start_time && currentTimeStr <= c.end_time);
    if (ongoing) {
      const endTime = new Date(`2000-01-01T${ongoing.end_time}`);
      return { 
        status: 'ongoing',
        value: 'Ongoing',
        label: `${ongoing.subject_name} — Ends at ${format(endTime, "h:mm aa")}`,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-50'
      };
    }

    // Next class
    const next = timetable.find(c => c.start_time > currentTimeStr);
    if (next) {
      const startTime = new Date(`2000-01-01T${next.start_time}`);
      
      // Calculate diff
      const todayStartTime = new Date();
      todayStartTime.setHours(startTime.getHours(), startTime.getMinutes(), 0);
      const diffMins = Math.round((todayStartTime.getTime() - now.getTime()) / (1000 * 60));
      
      let countdown = "";
      if (diffMins >= 60) {
        const hrs = Math.floor(diffMins / 60);
        countdown = `Starts in ${hrs} ${hrs === 1 ? 'hour' : 'hours'}`;
      } else {
        countdown = `Starts in ${diffMins} minutes`;
      }

      const isUrgent = diffMins <= 15;

      return {
        status: 'next',
        value: countdown,
        label: `${next.subject_name} | ${next.teacher_name} | ${format(startTime, "h:mm aa")} | P${next.period_number} | Room: ${profile.section}`,
        iconColor: isUrgent ? 'text-amber-600' : 'text-blue-600',
        iconBg: isUrgent ? 'bg-amber-50' : 'bg-blue-50'
      };
    }

    return { status: 'done', value: 'Classes Done', label: 'No more classes today', iconColor: 'text-slate-400', iconBg: 'bg-slate-50' };
  };

  const nextClass = getNextClassInfo();

  return (
    <div className="space-y-6">
      {/* ... WELCOME HEADER ... */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-blue-50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
          <Avatar className="h-20 w-20 border-4 border-blue-50 shadow-sm ring-2 ring-white flex-shrink-0">
            <AvatarImage src={profile.photo} />
            <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
              {profile.name?.split(" ").map((n: any) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight truncate">
              Welcome back, {profile.name}! 👋
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-base mt-1">
              Class: <span className="text-blue-600 font-bold">{profile.class}</span> | 
              Section: <span className="text-blue-600 font-bold">{profile.section}</span> | 
              Roll No: <span className="text-blue-600 font-bold">{profile.rollNo}</span>
            </p>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end relative z-10">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Today's Date</div>
           <div className="text-lg font-bold text-slate-800 leading-none">
             {format(new Date(), "EEEE, MMMM dd, yyyy")}
           </div>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Next Class"
          value={nextClass.value}
          secondaryLabel={nextClass.label}
          icon={Clock}
          iconColor={nextClass.iconColor}
          iconBg={nextClass.iconBg}
          className="font-bold"
        />
        <StatsCard
          title="Attendance Status"
          value={stats.todayAttendance}
          secondaryLabel={stats.todayAttendance === 'Present' ? "You're marked for today" : "Attendance not yet marked"}
          icon={CheckCircle2}
          iconColor={stats.todayAttendance === 'Present' ? "text-emerald-600" : "text-amber-600"}
          iconBg={stats.todayAttendance === 'Present' ? "bg-emerald-50" : "bg-amber-50"}
        />
        <StatsCard
          title="Upcoming Exam"
          value={getExamCountdown(stats.nextExamDate)}
          secondaryLabel={stats.nextExam !== 'None' ? `Subject: ${stats.nextExam}` : "No exams scheduled"}
          icon={CalendarClock}
          iconColor={stats.nextExamDate ? "text-indigo-600" : "text-slate-400"}
          iconBg={stats.nextExamDate ? "bg-indigo-50" : "bg-slate-50"}
        />
        <StatsCard
          title="Pending Fees"
          value={`₹${stats.pendingFees.toLocaleString()}`}
          secondaryLabel={stats.pendingFees > 0 ? "Outstanding balance" : "All fees paid"}
          icon={CreditCard}
          iconColor={stats.pendingFees > 0 ? "text-rose-600" : "text-emerald-600"}
          iconBg={stats.pendingFees > 0 ? "bg-rose-50" : "bg-emerald-50"}
        />
      </div>
    </div>
  );
};
