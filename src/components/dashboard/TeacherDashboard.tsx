"use client";

import { useState, useEffect } from "react";
import { TeacherStatsBar } from "./TeacherStatsBar";
import { TeacherQuickActions } from "./TeacherQuickActions";
import { ClassTeacherControl } from "./ClassTeacherControl";
import { MyClassesWidget } from "./MyClassesWidget";
import { RecentAttendanceWidget } from "./RecentAttendanceWidget";
import { PendingMarksWidget } from "./PendingMarksWidget";
import { TeacherUpcomingList } from "./TeacherUpcomingList";
import { Announcements } from "./Announcements";
import { TeacherSchedule } from "./TeacherSchedule";
import { AcademicCalendarWidget, CalendarDayDetail } from "@/components/campus-connect/academic-calendar-widget";
import { PageSkeleton } from "@/components/ui/skeletons";
import { AlertCircle, RefreshCcw, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";

export const TeacherDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      if (!profile) {
        const profileRes = await api.get("/api/auth/profile");
        if (profileRes.data.success) {
          setProfile(profileRes.data.data);
        }
      }
      
      const summaryRes = await api.get("/api/dashboard/summary");
      if (summaryRes.data.success) {
        setDashboardData(summaryRes.data.data);
        setError(null);
      }
    } catch (err: any) {
      console.error("Failed to fetch teacher dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Real-time refresh every 60s
    return () => clearInterval(interval);
  }, [profile]);

  if (loading && !dashboardData) {
    return <PageSkeleton rows={15} />;
  }

  if (error && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-[#F8FAFC]">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
          <p className="text-slate-500 text-sm max-w-xs">{error}</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="gap-2 border-slate-200">
          <RefreshCcw className="h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    );
  }

  const { 
    stats, 
    myClasses, 
    recentAttendance, 
    pendingMarks, 
    upcoming, 
    announcements,
    classTeacherOf,
    eventDuty
  } = dashboardData || {};

  return (
    <div className="bg-[#F8FAFC] -m-4 sm:-m-6 min-h-screen p-6 md:p-8 lg:p-10 animate-in fade-in duration-500 space-y-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* ON LEAVE BANNER */}
        {profile?.user_status_id === 7 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center justify-between shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <AlertCircle className="w-24 h-24 -mr-8 -mt-8 rotate-12" />
            </div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="bg-rose-500 p-4 rounded-2xl shadow-lg shadow-rose-200">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-rose-600 tracking-tight">You are currently "On Leave"</h2>
                <p className="text-rose-500/70 font-bold text-sm">Your schedule and duties are being managed by substitute teachers.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* EVENT DUTY BANNER */}
        {eventDuty && eventDuty.length > 0 && (
          <div className="bg-blue-600 p-8 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl shadow-blue-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-sm">
                 <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Event Duty Today</h2>
                <p className="text-blue-100 font-bold text-sm">
                  You are the coordinator for <span className="text-white underline decoration-blue-400 decoration-2 underline-offset-4">{eventDuty[0].event_name}</span>.
                </p>
                <div className="flex items-center gap-2 mt-2">
                   <Badge className="bg-white/20 text-white border-none rounded-full px-3">{eventDuty[0].class_name} {eventDuty[0].section_name}</Badge>
                   <Badge className={cn(
                     "rounded-full px-3",
                     eventDuty[0].attendance_status === 'submitted' ? "bg-emerald-400 text-white" : "bg-amber-400 text-blue-900 shadow-lg shadow-amber-500/20"
                   )}>
                     {eventDuty[0].attendance_status === 'submitted' ? 'Attendance Complete' : 'Attendance Pending'}
                   </Badge>
                </div>
              </div>
            </div>
            <Button 
              className="bg-white text-blue-600 hover:bg-blue-50 h-14 px-8 rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl shadow-blue-900/10 active:scale-95 transition-all relative z-10"
              onClick={() => window.location.href = `/main/events/attendance/${eventDuty[0].event_id}/${eventDuty[0].class_id}`}
            >
              {eventDuty[0].attendance_status === 'submitted' ? "View Records" : "Mark Attendance"}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* ZONE 1 — STATS BAR */}
        <TeacherStatsBar stats={stats} classTeacherOf={classTeacherOf} profile={profile} />

        {/* ZONE 1.5 — CLASS TEACHER CONTROL (ONLY IF ASSIGNED) */}
        {classTeacherOf && (
           <ClassTeacherControl classTeacherOf={classTeacherOf} />
        )}
        
        {/* ZONE 2 — QUICK ACTIONS */}
        <TeacherQuickActions />
        
        {/* ZONE 3 — TEACHER TIMETABLE (UNCHANGED CARD) */}
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-blue-50 shadow-sm relative overflow-hidden">
           <TeacherSchedule staffId={profile?.staff_id} />
        </div>

        {/* ZONE 4 — MASTER CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* MAIN COMMAND COLUMN (LEFT 8/12) */}
          <div className="lg:col-span-8 space-y-8">
             {/* Primary Metrics: Classes */}
             <MyClassesWidget classes={myClasses} />
             
             {/* Secondary Tracking: Attendance & Marks */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <RecentAttendanceWidget attendance={recentAttendance} />
                <PendingMarksWidget pendingMarks={pendingMarks} />
             </div>

             {/* Upcoming Items (Broad View) */}
             <TeacherUpcomingList upcoming={upcoming} />
          </div>

          {/* ACTIVITY SIDEBAR (RIGHT 4/12) */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white dark:bg-slate-900 overflow-hidden shadow-sm border border-blue-50 rounded-xl p-1">
                <AcademicCalendarWidget 
                  selectedDate={selectedDate} 
                  onSelect={setSelectedDate} 
                  events={upcoming || []} 
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                />
             </div>
             <CalendarDayDetail date={selectedDate} events={upcoming || []} />
             <Announcements announcements={announcements} />
          </div>
        </div>
      </div>
    </div>
  );
};
