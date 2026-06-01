"use client";

import * as React from "react";
import { format, isAfter, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function AdminUpcomingEventsList({ events = [] }: { events?: any[] }) {
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
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-450 uppercase tracking-[0.2em] select-none">
                    Upcoming Holidays & Events
                </h3>
                <Link 
                    href="/main/academic-calendar"
                    className="text-[11px] font-black text-indigo-650 hover:text-indigo-800 uppercase tracking-widest transition-colors select-none"
                >
                    View All
                </Link>
            </div>
            
            <div className="space-y-4 pr-1">
                {sortedDates.map((dateKey) => (
                    <div key={dateKey} className="flex gap-4 group items-center">
                        {/* Compact Date Sidebar */}
                        <div className="flex flex-col items-center justify-center h-12 w-12 rounded-[1rem] bg-slate-50 border border-slate-100 shrink-0 select-none">
                            <span className="text-[11px] font-black text-[#3F4DF7] leading-none mb-1">
                                {format(new Date(dateKey), "dd")}
                            </span>
                            <div className="h-px w-4 bg-slate-200 mb-1" />
                            <span className="text-[9px] font-black text-[#3F4DF7] leading-none">
                                {format(new Date(dateKey), "MM")}
                            </span>
                        </div>

                        {/* Events for this date */}
                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                            {grouped[dateKey].map((ev: any, idx: number) => {
                                return (
                                    <div key={idx} className="flex items-center gap-2.5">
                                        <div className="h-[6px] w-[6px] rounded-full shrink-0 bg-[#3F4DF7]" />
                                        <h4 className="text-[12px] font-black text-slate-700 leading-snug group-hover:text-[#3F4DF7] transition-colors truncate flex-1">
                                            {ev.title}
                                        </h4>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {upcoming.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-[11px] font-medium italic select-none">
                        No upcoming items found
                    </div>
                )}
            </div>
        </div>
    );
}
