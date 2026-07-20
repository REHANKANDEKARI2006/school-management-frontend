import * as React from "react";
import { format, isAfter, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const CATEGORY_COLORS: Record<string, { dot: string; badge: string; label: string }> = {
    national:    { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700", label: "National" },
    maharashtra: { dot: "bg-orange-500",  badge: "bg-orange-100 text-orange-700",  label: "Maharashtra" },
    karnataka:  { dot: "bg-sky-400",     badge: "bg-sky-100 text-sky-700",       label: "Karnataka" },
    holiday:     { dot: "bg-rose-500",    badge: "bg-rose-100 text-rose-700",     label: "Holiday" },
    exam:        { dot: "bg-red-500",     badge: "bg-red-100 text-red-700",       label: "Exam" },
    event:       { dot: "bg-indigo-600",  badge: "bg-indigo-100 text-indigo-700", label: "Event" },
};

export function UpcomingEventsList({ events = [] }: { events?: any[] }) {
    const today = startOfToday();

    // Filter only future events and limit to 5
    const upcoming = events
        .filter(ev => isAfter(new Date(ev.time), today) && ev.category !== 'exam')
        .slice(0, 5);

    // Group by date
    const grouped = upcoming.reduce((acc, ev) => {
        const dateKey = format(new Date(ev.time), "yyyy-MM-dd");
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(ev);
        return acc;
    }, {} as Record<string, any[]>);

    const sortedDates = Object.keys(grouped).sort();

    return (
        <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-4">
                Upcoming Holidays & Events
            </h3>
            
            <div className="space-y-4 pr-1">
                {sortedDates.map((dateKey) => (
                    <div key={dateKey} className="flex gap-4 group">
                        {/* Compact Date Sidebar */}
                        <div className="flex flex-col items-center justify-center h-12 w-12 rounded-[1rem] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shrink-0">
                            <span className="text-[10px] font-black text-indigo-600 leading-none mb-1">
                                {format(new Date(dateKey), "dd")}
                            </span>
                            <div className="h-px w-4 bg-slate-200 mb-1" />
                            <span className="text-[10px] font-black text-slate-400 uppercase">
                                {format(new Date(dateKey), "MM")}
                            </span>
                        </div>

                        {/* Events for this date */}
                        <div className="flex flex-col gap-2 flex-1 min-w-0 pt-0.5">
                            {grouped[dateKey].map((ev: any, idx: number) => {
                                const cat = CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.event;
                                return (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", cat.dot)} />
                                        <h4 className="text-[12px] font-bold text-slate-700 dark:text-slate-200 leading-snug group-hover:text-indigo-600 transition-colors truncate">
                                            {ev.title}
                                        </h4>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {upcoming.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-[11px] font-medium italic">
                        No upcoming items found
                    </div>
                )}

                {events.length > 5 && (
                    <Link 
                        href="/main/academic-calendar" 
                        className="flex items-center justify-center gap-2 py-2 mt-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-widest border border-dashed border-slate-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30"
                    >
                        View All <ArrowRight size={12} />
                    </Link>
                )}
            </div>
        </div>
    );
}
