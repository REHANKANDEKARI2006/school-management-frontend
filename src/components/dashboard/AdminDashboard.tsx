import React, { useState, useEffect } from "react";
import { AdminStatsBar } from "./AdminStatsBar";
import { Card } from "@/components/ui/card";
import { AdminQuickActions } from "./AdminQuickActions";
import { AdminAcademicCalendarWidget, AdminCalendarDayDetail } from "./AdminAcademicCalendarWidget";
import { AdminUpcomingEventsList } from "./AdminUpcomingEventsList";
import { AdminAnnouncements } from "./AdminAnnouncements";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCcw, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AttendanceChart } from "./AttendanceChart";
import { ExamStatus } from "./ExamStatus";
import { FinanceChart } from "./FinanceChart";
import { FeeCollection } from "./FeeCollection";
import { StudentDistribution } from "./StudentDistribution";
import { ActivityFeed } from "./ActivityFeed";
import { HolidayBanner } from "./HolidayBanner";
import api from "@/lib/axios";
import { format } from "date-fns";
import { formatDate } from "@/lib/utils";
import { ROLE_DISPLAY_NAME } from "@/config/roles";

export const AdminDashboard = () => {
  const roleId = typeof window !== "undefined" ? Number(localStorage.getItem("role_id")) : 0;
  const roleName = ROLE_DISPLAY_NAME[roleId] || "Admin";

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [apiHolidays, setApiHolidays] = useState<any[]>([]);
  const [todayHolidays, setTodayHolidays] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/api/dashboard/summary");
      if (response.data.success) {
        setDashboardData(response.data.data);
        setError(null);
      }
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthHolidays = async (date: Date, setFn: (data: any[]) => void) => {
    try {
      const year = format(date, "yyyy");
      const month = format(date, "M");
      const res = await api.get(`/api/holidays?year=${year}&month=${month}`);
      if (res.data.success) {
        setFn(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch holidays for month:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchMonthHolidays(new Date(), setTodayHolidays); 
    const interval = setInterval(() => {
        fetchDashboardData();
        fetchMonthHolidays(new Date(), setTodayHolidays);
    }, 60000); 
    return () => clearInterval(interval);
  }, []);

  const monthKey = format(currentMonth, "yyyy-MM");

  useEffect(() => {
    fetchMonthHolidays(currentMonth, setApiHolidays);
  }, [monthKey]);

  const { stats, events = [], announcements } = dashboardData || {};
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isSunday = new Date().getDay() === 0;
  const isTodayHoliday = todayHolidays.some(h => h.date === todayStr) || isSunday;

  const allCalendarEvents = React.useMemo(() => {
    const uniqueMap = new Map();

    const process = (item: any) => {
        try {
            const dateKey = format(new Date(item.time), "yyyy-MM-dd");
            const nameKey = item.title.toLowerCase()
                .replace(/[^a-z0-9]/g, '')
                .replace('v', 'b');
            
            const key = `${dateKey}_${nameKey}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, item);
            }
        } catch (e) {
            console.error("Error processing event for deduplication:", e, item);
        }
    };

    apiHolidays.forEach(h => process({
      id: `h_${h.date}_${h.name}`,
      title: h.name,
      time: h.date,
      category: h.category?.toLowerCase() || 'event'
    }));

    events.forEach((e: any) => process({
      ...e,
      category: e.category?.toLowerCase() || 'event'
    }));

    return Array.from(uniqueMap.values()).filter(ev => ev.category !== 'exam');
  }, [apiHolidays, events]);

  if (loading && !dashboardData) {
    return (
      <div className="space-y-10">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <Skeleton className="h-[600px] lg:col-span-2 rounded-xl" />
           <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
          <p className="text-slate-500 text-sm max-w-xs">{error}</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" className="gap-2 border-slate-200 rounded-xl">
          <RefreshCcw className="h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <HolidayBanner />

        {/* WELCOME HEADER */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none">
          <div className="text-left">
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              {roleName} Dashboard
            </h1>
            <p className="text-slate-405 font-bold text-xs mt-1">
              Here's what's happening in your institute today.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/50 border border-blue-100/50 rounded-xl text-xs font-black text-blue-650 shrink-0">
            <span className="text-[11px] uppercase tracking-wide">
              {format(new Date(), "dd MMMM yyyy, EEEE")}
            </span>
          </div>
        </div>

        {/* ZONE 1 — STATS BAR */}
        <AdminStatsBar stats={stats} isHoliday={isTodayHoliday} />

        {/* ZONE 2 — QUICK ACTIONS ROW */}
        <AdminQuickActions />

        {/* ZONE 3 — THREE COLUMN MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUMN 1 (4/12 width) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <AttendanceChart 
              stats={dashboardData?.stats?.monthAttendance} 
              isHoliday={isTodayHoliday}
            />
            <FinanceChart data={dashboardData?.financeStats || []} />
            <StudentDistribution genderRatio={dashboardData?.genderRatio || []} />
          </div>

          {/* COLUMN 2 (4/12 width) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <ExamStatus events={dashboardData?.events || []} />
            <FeeCollection stats={{ 
              feesMonth: dashboardData?.stats?.feesMonth || 0,
              pendingDuesCount: dashboardData?.stats?.pendingDuesCount || 0,
              overdueStudentsCount: dashboardData?.stats?.overdueStudentsCount || 0
            }} />
            <ActivityFeed activities={dashboardData?.recentActivity || []} />
          </div>

          {/* COLUMN 3 (4/12 width) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Calendar Widget Card */}
            <Card className="rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden bg-white p-3">
              <AdminAcademicCalendarWidget 
                selectedDate={selectedDate} 
                onSelect={setSelectedDate} 
                events={allCalendarEvents} 
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
            </Card>

            {/* Upcoming Holidays & Events */}
            <Card className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm">
              <AdminUpcomingEventsList events={allCalendarEvents} />
            </Card>
            
            {/* Selected Day Detail */}
            <AdminCalendarDayDetail date={selectedDate} events={allCalendarEvents} />

            {/* Stay Connected Card */}
            <Card className="bg-gradient-to-br from-indigo-50/40 to-blue-50/20 p-6 rounded-2xl border border-slate-100/80 shadow-sm flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 mb-3">
                <Megaphone className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-black text-slate-800">Stay Connected with CampusConnect</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1 max-w-[200px] leading-normal">
                Get important updates and announcements instantly.
              </p>
              <Link href="/main/notices" className="w-full">
                <Button variant="outline" className="w-full mt-4 bg-white border border-slate-200 text-blue-650 hover:bg-slate-50 font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl shadow-sm">
                  Send Announcement
                </Button>
              </Link>
            </Card>
          </div>
        </div>

        {/* ZONE 4 — BOTTOM CARD (Recent Notices) */}
        <AdminAnnouncements announcements={announcements} />
      </div>
    </div>
  );
};
