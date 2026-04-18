import React, { useState, useEffect } from "react";
import { StatsBar } from "./StatsBar";
import { Card } from "@/components/ui/card";
import { QuickActions } from "./QuickActions";
import { AcademicCalendarWidget, CalendarDayDetail } from "@/components/campus-connect/academic-calendar-widget";
import { UpcomingEventsList } from "@/components/campus-connect/upcoming-events-list";
import { Announcements } from "./Announcements";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCcw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AttendanceChart } from "./AttendanceChart";
import { ExamStatus } from "./ExamStatus";
import { FinanceChart } from "./FinanceChart";
import { FeeCollection } from "./FeeCollection";
import { StudentDistribution } from "./StudentDistribution";
import { ActivityFeed } from "./ActivityFeed";
import api from "@/lib/axios";
import { format } from "date-fns";

export const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [apiHolidays, setApiHolidays] = useState<any[]>([]);

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

  const fetchMonthHolidays = async (date: Date) => {
    try {
      const year = format(date, "yyyy");
      const month = format(date, "M");
      const res = await api.get(`/api/holidays?year=${year}&month=${month}`);
      if (res.data.success) {
        setApiHolidays(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch holidays for month:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Live refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const monthKey = format(currentMonth, "yyyy-MM");

  useEffect(() => {
    fetchMonthHolidays(currentMonth);
  }, [monthKey]);

  const { stats, events = [], announcements } = dashboardData || {};

  // Unified Event Merging and Deduplication - Moved above conditional returns to follow Rules of Hooks
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
      <div className="p-6 space-y-8 bg-[#F7F8FA] min-h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-[12px]" />
          ))}
        </div>
        <Skeleton className="h-24 w-full rounded-[12px]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Skeleton className="h-[500px] lg:col-span-2 rounded-[12px]" />
           <Skeleton className="h-[500px] rounded-[12px]" />
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-[#F7F8FA]">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
          <p className="text-slate-500 text-sm max-w-xs">{error}</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" className="gap-2 border-slate-200">
          <RefreshCcw className="h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-[#F7F8FA] animate-in fade-in duration-700">
      {/* ZONE 1 — STATS BAR */}
      <StatsBar stats={stats} />

      {/* ZONE 2 — QUICK ACTIONS ROW */}
      <QuickActions />

      {/* ZONE 3 — THREE COLUMN MAIN CONTENT */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT & CENTER COLUMNS */}
        <div className="w-full lg:w-2/3 flex flex-col gap-8">
          {/* Main Operational Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AttendanceChart data={dashboardData?.attendanceStats || []} />
            <ExamStatus events={dashboardData?.events || []} />
            
            <div className="md:col-span-2">
              <FinanceChart data={dashboardData?.financeStats || []} />
            </div>

            <FeeCollection stats={{ 
              feesMonth: dashboardData?.stats?.feesMonth || 0,
              pendingDuesCount: dashboardData?.stats?.pendingDuesCount || 0,
              overdueStudentsCount: dashboardData?.stats?.overdueStudentsCount || 0
            }} />
            <StudentDistribution genderRatio={dashboardData?.genderRatio || []} />
          </div>

          <Announcements announcements={announcements} />
        </div>

        {/* RIGHT COLUMN (SIDEBAR) — Fixed Truncation Issues */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          {/* Calendar Widget Card */}
          <Card className="border-none shadow-sm overflow-visible bg-white dark:bg-slate-900 rounded-xl">
             <div className="p-1 relative group">
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href="/main/academic-calendar" className="p-1.5 bg-white/80 backdrop-blur rounded-lg shadow-sm hover:bg-white text-indigo-600 transition-all border border-slate-100">
                      <ExternalLink size={14} />
                    </Link>
                </div>
                <AcademicCalendarWidget 
                  selectedDate={selectedDate} 
                  onSelect={setSelectedDate} 
                  events={allCalendarEvents} 
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                />
             </div>
          </Card>

          <CalendarDayDetail date={selectedDate} events={allCalendarEvents} />
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border-none">
             <UpcomingEventsList events={allCalendarEvents} />
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border-none">
             <ActivityFeed activities={dashboardData?.recentActivity || []} />
          </div>
        </div>
      </div>

    </div>
  );
};
