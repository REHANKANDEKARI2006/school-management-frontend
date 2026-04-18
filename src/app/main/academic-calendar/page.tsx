"use client";

import * as React from "react";
import RouteGuard from "@/components/auth/RouteGuard";
import { ADMIN_GROUP } from "@/config/roles";
import api from "@/lib/axios";
import { format, isAfter, startOfToday } from "date-fns";
import { ArrowLeft, Calendar, Info } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_COLORS: Record<string, { badge: string; label: string }> = {
    national: { badge: "bg-green-100 text-green-700 border-green-200", label: "National" },
    holiday:  { badge: "bg-blue-100 text-blue-700 border-blue-200",   label: "Holiday" },
    event:    { badge: "bg-purple-100 text-purple-700 border-purple-200", label: "Event" },
    exam:     { badge: "bg-rose-100 text-rose-700 border-rose-200",     label: "Exam" },
};

export default function AcademicCalendarPage() {
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const today = startOfToday();

  React.useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get("/api/events");
        if (response.data.success) {
          // Filter for upcoming events and sort by date
          const upcoming = response.data.data
            .filter((ev: any) => {
              try {
                const date = new Date(ev.time);
                if (isNaN(date.getTime())) return false;
                return isAfter(date, today) || format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
              } catch (err) {
                return false;
              }
            })
            .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());
          setEvents(upcoming);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <RouteGuard allowedRoles={ADMIN_GROUP}>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto py-8 px-4 sm:px-6">
        
        {/* BACK BUTTON & HEADER */}
        <div className="flex flex-col gap-6">
          <Link 
            href="/main/dashboard" 
            className="flex items-center gap-2 text-[11px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em] group w-fit"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Upcoming Holidays & Events</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Academic Year 2025-2026</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
               <Calendar size={24} />
            </div>
          </div>
        </div>

        {/* CONTENT LIST */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-6 items-center">
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                  <Skeleton className="h-6 flex-1 rounded-lg" />
                  <Skeleton className="h-6 w-20 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {events.map((event, idx) => {
                const cat = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.event;
                return (
                  <div key={idx} className="flex items-center gap-4 sm:gap-8 p-6 hover:bg-slate-50/50 transition-colors group">
                    {/* Date Sidebar */}
                    <div className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 shrink-0 group-hover:bg-white group-hover:border-indigo-100 group-hover:shadow-sm transition-all">
                        <span className="text-lg font-black text-slate-900 leading-none">
                            {format(new Date(event.time), "d")}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase mt-1">
                            {format(new Date(event.time), "MMM")}
                        </span>
                    </div>

                    {/* Middle: Title */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 text-lg sm:text-xl leading-tight truncate group-hover:text-indigo-600 transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium truncate mt-0.5">
                        {format(new Date(event.time), "EEEE")} • {event.location || "School Campus"}
                      </p>
                    </div>

                    {/* Right: Badge */}
                    <Badge className={`${cat.badge} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 hidden sm:flex`}>
                      {cat.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
               <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <Info size={32} />
               </div>
               <div className="max-w-xs">
                 <h3 className="text-lg font-black text-slate-800">No events found</h3>
                 <p className="text-sm font-medium text-slate-500 mt-1">Check back later for upcoming holidays and school events.</p>
               </div>
            </div>
          )}
        </div>

        {/* FOOTER INFO */}
        <div className="p-6 rounded-3xl bg-indigo-50/30 border border-indigo-100/50 flex items-start gap-4">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shrink-0 mt-0.5">
               <Info size={16} />
            </div>
            <p className="text-[12px] leading-relaxed text-indigo-900/70 font-medium italic">
              All dates are subject to change based on academic requirements or government mandates. For detailed Panchang inquiries, please consult the printed school diary.
            </p>
        </div>

      </div>
    </RouteGuard>
  );
}
