"use client";

import { useState, useEffect } from "react";
import { TeacherStatsBar } from "./TeacherStatsBar";
import { TeacherQuickActions } from "./TeacherQuickActions";
import { MyClassesWidget } from "./MyClassesWidget";
import { RecentAttendanceWidget } from "./RecentAttendanceWidget";
import { PendingMarksWidget } from "./PendingMarksWidget";
import { TeacherUpcomingList } from "./TeacherUpcomingList";
import { Announcements } from "./Announcements";
import { TeacherSchedule } from "./TeacherSchedule";
import { HolidayBanner } from "./HolidayBanner";
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
  const [todayHolidays, setTodayHolidays] = useState<any[]>([]);

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

      // Fetch today's holidays
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const dateStr = now.toISOString().split('T')[0];
      const holidayRes = await api.get(`/api/holidays?year=${year}&month=${month}`);
      if (holidayRes.data.success) {
        const found = holidayRes.data.data.filter((h: any) => h.date === dateStr);
        setTodayHolidays(found);
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
  const isSunday = new Date().getDay() === 0;
  const isTodayHoliday = todayHolidays.length > 0 || isSunday;

  return (
    <div className="p-4 space-y-4 bg-[#F8FAFC] min-h-screen animate-in fade-in duration-500">
      <div className="w-full space-y-4">
        
        <HolidayBanner />

        {/* ON LEAVE BANNER */}
        {profile?.user_status_id === 7 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <AlertCircle className="w-20 h-20 -mr-6 -mt-6 rotate-12" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-rose-500 p-3 rounded-xl shadow-lg shadow-rose-200">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xl font-black text-rose-600 tracking-tight">You are currently "On Leave"</h2>
                <p className="text-rose-500/70 font-bold text-[10px] uppercase tracking-wider">Your duties are being managed by substitutes.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* EVENT DUTY BANNER */}
        {eventDuty && eventDuty.length > 0 && (
          <div className="bg-blue-600 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm">
                 <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">Event Duty Today</h2>
                <p className="text-blue-100 font-bold text-[10px] uppercase tracking-wide">
                  Coordinator for <span className="text-white underline decoration-blue-400 decoration-1 underline-offset-4">{eventDuty[0].event_name}</span>.
                </p>
                <div className="flex items-center gap-2 mt-1">
                   <Badge className="bg-white/20 text-white border-none rounded-full px-2 py-0 text-[8px]">{eventDuty[0].class_name} {eventDuty[0].section_name}</Badge>
                </div>
              </div>
            </div>
            <Button 
              className="bg-white text-blue-600 hover:bg-blue-50 h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-blue-900/10 active:scale-95 transition-all relative z-10"
              onClick={() => window.location.href = `/main/events/attendance/${eventDuty[0].event_id}/${eventDuty[0].class_id}`}
            >
              {eventDuty[0].attendance_status === 'submitted' ? "View" : "Mark"} Attendance
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ZONE 1 — STATS BAR */}
        <TeacherStatsBar stats={stats} classTeacherOf={classTeacherOf} profile={profile} isHoliday={isTodayHoliday} />

        {/* ZONE 2 — QUICK ACTIONS */}
        <TeacherQuickActions />
        
        {/* ZONE 3 — TEACHER TIMETABLE */}
        <TeacherSchedule staffId={profile?.staff_id} />

        {/* ZONE 4 — MASTER CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* MAIN COMMAND COLUMN (LEFT 8/12) */}
          <div className="lg:col-span-8 space-y-8">
             {/* Primary Metrics: Classes */}
             <MyClassesWidget classes={myClasses} />
             
             {/* Secondary Tracking: Attendance & Marks */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RecentAttendanceWidget attendance={recentAttendance} />
                <PendingMarksWidget pendingMarks={pendingMarks} />
             </div>

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
             <Announcements announcements={announcements?.map((a: any) => ({
                ...a,
                date: a.created_at,
                description: a.content
             }))} />
          </div>
        </div>
      </div>
    </div>
  );
};
