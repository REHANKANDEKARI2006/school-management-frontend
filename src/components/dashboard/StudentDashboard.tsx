"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { StudentStatsBar } from "./StudentStatsBar";
import { StudentQuickActions } from "./StudentQuickActions";
import { WeeklyTimetable } from "./WeeklyTimetable";
import { StudentMaterialsWidget } from "./StudentMaterialsWidget";
import { HolidayBanner } from "./HolidayBanner";
import { StudentAnnouncements } from "./StudentAnnouncements";
import { StudentAcademicCalendarWidget, StudentCalendarDayDetail } from "./StudentAcademicCalendarWidget";
import { StudentUpcomingEventsList } from "./StudentUpcomingEventsList";
import { PageSkeleton } from "@/components/ui/skeletons";
import { AlertCircle, RefreshCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import api from "@/lib/axios";
import { getCachedData, setCachedData, formatExactTimestamp } from "@/lib/dashboardCache";
import { useToast } from "@/hooks/use-toast";

export const StudentDashboard = () => {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const lastUpdatedText = formatExactTimestamp(lastUpdated);
  const refreshInFlight = useRef(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [todayHolidays, setTodayHolidays] = useState<any[]>([]);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      if (refreshInFlight.current) return;
      refreshInFlight.current = true;
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      if (!profile) {
        const profileRes = await api.get("/api/auth/profile");
        if (profileRes.data.success) {
          setProfile(profileRes.data.data);
        }
      }

      const summaryRes = await api.get("/api/dashboard/summary");
      if (summaryRes.data.success) {
        const data = summaryRes.data.data;
        const now = Date.now();
        setDashboardData(data);
        setLastUpdated(now);
        setCachedData("dashboard_student", data, now);
        setError(null);
      }

      // Fetch today's holidays
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const dateStr = now.toISOString().split("T")[0];
      const holidayRes = await api.get(`/api/holidays?year=${year}&month=${month}`);
      if (holidayRes.data.success) {
        const found = holidayRes.data.data.filter((h: any) => h.date === dateStr);
        setTodayHolidays(found);
      }
    } catch (err: any) {
      console.error("Failed to fetch student dashboard data:", err);
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
  }, [profile, dashboardData, toast]);

  useEffect(() => {
    const cached = getCachedData("dashboard_student");
    if (cached && cached.data) {
      setDashboardData(cached.data);
      setLastUpdated(cached.timestamp);
      setLoading(false);
    } else {
      fetchData(false);
    }
  }, []);

  if (loading && !dashboardData) {
    return <PageSkeleton rows={15} />;
  }

  if (error && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
          <p className="text-slate-500 text-sm max-w-xs">{error}</p>
        </div>
        <Button onClick={() => fetchData()} variant="outline" className="gap-2 border-slate-200 rounded-xl">
          <RefreshCcw className="h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    );
  }

  const { stats, timetable, upcoming, announcements } = dashboardData || {};
  const isSunday = new Date().getDay() === 0;
  const isTodayHoliday = todayHolidays.length > 0 || isSunday;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="w-full space-y-4">

        {/* ZONE 1 — HOLIDAY BANNER */}
        <HolidayBanner />

        {/* WELCOME HEADER WITH REFRESH */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 select-none">
          <h1 className="text-lg font-black text-slate-800 tracking-tight">Student Dashboard</h1>
          <div className="flex items-center gap-3">
            {lastUpdatedText && (
              <span className="text-[10px] font-semibold text-slate-400">
                {lastUpdatedText}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="gap-1.5 border-slate-200 rounded-xl text-xs font-bold h-9 px-3"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>
        {/* ZONE 2 — STUDENT STATS BAR */}
        <StudentStatsBar profile={profile} stats={stats} timetable={timetable} />

        {/* ZONE 3 — QUICK ACTIONS */}
        <StudentQuickActions />

        {/* ZONE 4 — MASTER CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* MAIN CONTENT COLUMN (LEFT 8/12) */}
          <div className="lg:col-span-8 space-y-4">

            {/* Today's Timetable */}
            <WeeklyTimetable
              timetable={timetable}
              isHoliday={isTodayHoliday}
              isSunday={isSunday}
            />

            {/* Secondary Widgets Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StudentMaterialsWidget />
              <StudentAnnouncements announcements={announcements} />
            </div>

          </div>

          {/* SIDEBAR COLUMN (RIGHT 4/12) */}
          <div className="lg:col-span-4 space-y-4">

            {/* Academic Calendar */}
            <Card className="rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden bg-white p-3">
              <StudentAcademicCalendarWidget
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                events={upcoming || []}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
            </Card>

            {/* Selected Day Detail */}
            <StudentCalendarDayDetail date={selectedDate} events={upcoming || []} />

            {/* Upcoming Events & Holidays */}
            <Card className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm">
              <StudentUpcomingEventsList events={upcoming || []} />
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};
