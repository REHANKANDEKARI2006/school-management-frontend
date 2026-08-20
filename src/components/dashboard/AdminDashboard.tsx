import React, { useState, useEffect, useCallback, useRef } from "react";
import { AdminStatsBar } from "./AdminStatsBar";
import { Card } from "@/components/ui/card";
import { AdminQuickActions } from "./AdminQuickActions";
import { AdminAcademicCalendarWidget, AdminCalendarDayDetail } from "./AdminAcademicCalendarWidget";
import { AdminUpcomingEventsList } from "./AdminUpcomingEventsList";
import { AdminAnnouncements } from "./AdminAnnouncements";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCcw, Megaphone, Loader2 } from "lucide-react";
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
import { getCachedData, setCachedData, formatExactTimestamp } from "@/lib/dashboardCache";
import { useToast } from "@/hooks/use-toast";

export const AdminDashboard = () => {
  const roleId = typeof window !== "undefined" ? Number(localStorage.getItem("role_id")) : 0;
  const roleName = ROLE_DISPLAY_NAME[roleId] || "Admin";

  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const lastUpdatedText = formatExactTimestamp(lastUpdated);
  const refreshInFlight = useRef(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [apiHolidays, setApiHolidays] = useState<any[]>([]);
  const [todayHolidays, setTodayHolidays] = useState<any[]>([]);
  const [pendingLeavesCount, setPendingLeavesCount] = useState<number | null>(null);

  const fetchPendingLeaves = async () => {
    try {
      const res = await api.get("/api/leaves/admin-stats");
      if (res.data?.success && res.data?.data?.pending_count !== undefined) {
        setPendingLeavesCount(Number(res.data.data.pending_count));
      }
    } catch (err) {
      console.error("Failed to fetch pending leaves stats:", err);
    }
  };

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      if (refreshInFlight.current) return;
      refreshInFlight.current = true;
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    fetchPendingLeaves();
    try {
      const response = await api.get("/api/dashboard/summary");
      if (response.data.success) {
        const data = response.data.data;
        const now = Date.now();
        setDashboardData(data);
        setLastUpdated(now);
        setCachedData("dashboard_admin", data, now);
        setError(null);
      }
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      if (isManualRefresh && dashboardData) {
        toast({
          title: "Refresh failed",
          description: err.response?.data?.message || "Could not update dashboard data. Showing last known data.",
          variant: "destructive",
        });
      } else if (!dashboardData) {
        setError(err.message || "Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      refreshInFlight.current = false;
    }
  }, [dashboardData, toast]);

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
    const cached = getCachedData("dashboard_admin");
    if (cached && cached.data) {
      setDashboardData(cached.data);
      setLastUpdated(cached.timestamp);
      setLoading(false);
    } else {
      fetchDashboardData(false);
    }
    fetchMonthHolidays(new Date(), setTodayHolidays);
    fetchPendingLeaves();
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
        <Button onClick={() => fetchDashboardData()} variant="outline" className="gap-2 border-slate-200 rounded-xl">
          <RefreshCcw className="h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
        <HolidayBanner />

        {/* WELCOME HEADER */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 select-none">
          <div className="text-left hidden md:block">
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              {roleName} Dashboard
            </h1>
            <p className="text-slate-400 font-bold text-xs mt-1">
              Here's what's happening in your institute today.
              {lastUpdatedText && (
                <span className="ml-2 text-[10px] font-semibold text-slate-400 hidden sm:inline">
                  • {lastUpdatedText}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="gap-1.5 border-slate-200 rounded-xl text-xs font-bold h-9 px-3.5 shrink-0 order-2 sm:order-1"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <div className="flex-1 sm:flex-initial flex items-center gap-2 px-3 py-2 bg-blue-50/50 border border-blue-100/50 rounded-xl text-xs font-black text-blue-650 justify-center sm:justify-start min-w-0 order-1 sm:order-2">
              <span className="text-[10px] xs:text-[11px] uppercase tracking-wide whitespace-nowrap truncate">
                {format(new Date(), "dd MMMM yyyy, EEEE")}
              </span>
            </div>
          </div>
        </div>

        {/* ZONE 1 — STATS BAR */}
        <AdminStatsBar stats={stats ? { ...stats, pendingLeaves: stats?.pendingLeaves ?? pendingLeavesCount ?? 0 } : undefined} isHoliday={isTodayHoliday} />

        {/* ZONE 2 — QUICK ACTIONS ROW */}
        <AdminQuickActions />

        {/* ZONE 3 — THREE COLUMN MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          
          {/* COLUMN 1 (4/12 width) */}
          <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6">
            <AttendanceChart 
              stats={dashboardData?.stats?.monthAttendance} 
              isHoliday={isTodayHoliday}
            />
            <FinanceChart data={dashboardData?.financeStats || []} />
            <StudentDistribution genderRatio={dashboardData?.genderRatio || []} />
          </div>

          {/* COLUMN 2 (4/12 width) */}
          <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6">
            <ExamStatus events={dashboardData?.events || []} />
            <FeeCollection stats={{ 
              feesMonth: dashboardData?.stats?.feesMonth || 0,
              pendingDuesCount: dashboardData?.stats?.pendingDuesCount || 0,
              overdueStudentsCount: dashboardData?.stats?.overdueStudentsCount || 0
            }} />
            <ActivityFeed activities={dashboardData?.recentActivity || []} />
          </div>

          {/* COLUMN 3 (4/12 width) */}
          <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6">
            {/* Calendar Widget Card */}
            <Card className="rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden bg-white p-2 sm:p-3">
              <AdminAcademicCalendarWidget 
                selectedDate={selectedDate} 
                onSelect={setSelectedDate} 
                events={allCalendarEvents} 
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
            </Card>

            {/* Upcoming Holidays & Events */}
            <Card className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100/80 shadow-sm">
              <AdminUpcomingEventsList events={allCalendarEvents} />
            </Card>
            
            {/* Selected Day Detail */}
            <AdminCalendarDayDetail date={selectedDate} events={allCalendarEvents} />

            {/* Stay Connected Card */}
            <Card className="bg-gradient-to-br from-indigo-50/40 to-blue-50/20 p-4 sm:p-6 rounded-2xl border border-slate-100/80 shadow-sm flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 mb-3">
                <Megaphone className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-black text-slate-800">Stay Connected with SchoolOS</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1 max-w-[200px] leading-normal">
                Get important updates and announcements instantly.
              </p>
              <Link href="/main/notices" className="w-full">
                <Button variant="outline" className="w-full mt-4 bg-white border border-slate-200 text-blue-650 hover:bg-slate-50 font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl shadow-sm min-h-[44px]">
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
