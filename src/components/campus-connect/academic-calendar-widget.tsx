"use client";

import * as React from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";

/* =========================
   HOLIDAYS: Fetched from database via API (Google Calendar + Custom).
   Categories: national (green), holiday (blue), exam (red), event (purple)
========================= */

interface AcademicCalendarWidgetProps {
  selectedDate?: Date;
  onSelect?: (date: Date) => void;
  events?: any[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function AcademicCalendarWidget({ 
  selectedDate: externalSelected, 
  onSelect,
  events = [],
  currentMonth,
  onMonthChange
}: AcademicCalendarWidgetProps) {
  const [internalSelected, setInternalSelected] = React.useState(new Date()); 

  const selectedDate = externalSelected || internalSelected;
  const setSelectedDate = (d: Date) => {
      if (onSelect) onSelect(d);
      else setInternalSelected(d);
  };

  const nextMonth = () => onMonthChange(addMonths(currentMonth, 1));
  const prevMonth = () => onMonthChange(subMonths(currentMonth, 1));

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-7 w-7 text-slate-400 hover:text-indigo-600">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-7 w-7 text-slate-400 hover:text-indigo-600">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return (
      <div className="grid grid-cols-7 my-2">
        {days.map((d, i) => (
          <div key={d} className={cn(
              "text-center text-[10px] font-bold tracking-widest",
              i === 0 ? "text-red-500" : "text-slate-400"
          )}>
            {d}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rowItems = [];
    let currentDay = startDate;

    while (currentDay <= endDate) {
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = currentDay;
        const dayEvents = events
          .filter(ev => {
            const eventStart = new Date(ev.event_start_date || ev.time || ev.event_date);
            const eventEnd = new Date(ev.event_end_date || ev.time || ev.event_date);
            // Check if 'd' is between start and end inclusive
            const checkDate = new Date(d);
            checkDate.setHours(0,0,0,0);
            const start = new Date(eventStart);
            start.setHours(0,0,0,0);
            const end = new Date(eventEnd);
            end.setHours(0,0,0,0);
            
            return checkDate >= start && checkDate <= end;
          })
          .map(ev => ({ 
            label: ev.title || ev.event_name, 
            category: ev.category || (ev.event_type?.toLowerCase().includes('holiday') ? 'holiday' : 'event') 
          }));
        
        const isSelected = isSameDay(d, selectedDate);
        const isCurrentMonth = isSameMonth(d, monthStart);
        const isSunday = getDay(d) === 0;

        days.push(
          <div
            key={d.toString()}
            className={cn(
              "relative min-h-[44px] flex flex-col items-center justify-center cursor-pointer transition-all group",
              !isCurrentMonth && "opacity-20 pointer-events-none"
            )}
            onClick={() => setSelectedDate(d)}
          >
            {isSelected && (
              <motion.div 
                layoutId="pill"
                className="absolute inset-0.5 bg-indigo-600 shadow-sm border border-indigo-500 rounded-lg z-0" 
              />
            )}

            <div className="relative z-10 flex flex-col items-center">
                <span className={cn(
                  "text-sm font-bold tabular-nums leading-none",
                  isSelected ? "text-white" : isSunday ? "text-red-500" : "text-slate-700 dark:text-slate-300"
                )}>
                  {format(d, "d")}
                </span>

                 <div className="flex gap-0.5 mt-1 h-1 items-center justify-center">
                    {dayEvents.slice(0, 3).map((h, idx) => (
                      <div key={idx} className={cn(
                          "h-1 w-1 rounded-full",
                          h.category?.toLowerCase() === 'national' ? "bg-emerald-500" : 
                          h.category?.toLowerCase() === 'maharashtra' ? "bg-orange-500" : 
                          h.category?.toLowerCase() === 'karnataka' ? "bg-sky-400" : 
                          h.category?.toLowerCase() === 'holiday' || h.category?.toLowerCase() === 'school holiday' || h.category?.toLowerCase() === 'holiday activity' ? "bg-rose-500" :
                          h.category?.toLowerCase() === 'event' || h.category?.toLowerCase() === 'exam or test' || h.category?.toLowerCase() === 'educational trip' ? "bg-indigo-600" : "bg-slate-400"
                      )} />
                    ))}
                 </div>
            </div>
          </div>
        );
        currentDay = addDays(currentDay, 1);
      }
      rowItems.push(
        <div className="grid grid-cols-7" key={currentDay.toString()}>
          {days}
        </div>
      );
    }
    return <div className="space-y-0.5">{rowItems}</div>;
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-none shadow-none overflow-visible">
      {renderHeader()}
      <div className="p-2 min-h-[340px]">
        {renderDays()}
        {renderCells()}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 py-2 border-t border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/20 px-4">
         <div className="flex items-center gap-1">
            <div className="h-1 w-1 rounded-full bg-emerald-500" />
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-emerald-600">National</span>
         </div>
         <div className="flex items-center gap-1">
            <div className="h-1 w-1 rounded-full bg-orange-500" />
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-orange-600">Maharashtra</span>
         </div>
         <div className="flex items-center gap-1">
            <div className="h-1 w-1 rounded-full bg-sky-400" />
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-sky-500">Karnataka</span>
         </div>
         <div className="flex items-center gap-1">
            <div className="h-1 w-1 rounded-full bg-rose-500" />
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-rose-500">Holiday</span>
         </div>
         <div className="flex items-center gap-1">
            <div className="h-1 w-1 rounded-full bg-indigo-600" />
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-indigo-600">Event</span>
         </div>
      </div>
    </div>
  );
}

/* =========================
   DETAIL VIEW COMPONENT: Lean Version
========================= */
export function CalendarDayDetail({ date, events = [] }: { date: Date; events?: any[] }) {
    const dayEvents = events
      .filter(ev => {
        const eventStart = new Date(ev.event_start_date || ev.time || ev.event_date);
        const eventEnd = new Date(ev.event_end_date || ev.time || ev.event_date);
        const checkDate = new Date(date);
        checkDate.setHours(0,0,0,0);
        const start = new Date(eventStart);
        start.setHours(0,0,0,0);
        const end = new Date(eventEnd);
        end.setHours(0,0,0,0);
        
        return checkDate >= start && checkDate <= end;
      })
      .map(ev => ({ label: ev.title || ev.event_name, category: ev.category || ev.event_type || 'event' }));
    
    return (
        <Card className="shadow-sm border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden rounded-xl">
            <CardHeader className="p-4 border-b border-slate-50 dark:border-slate-800/50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Selected Date
                </p>
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none mt-1">
                    {format(date, "EEEE, d MMMM yyyy")}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                {dayEvents.length === 0 ? (
                    <div className="flex items-center gap-2 text-slate-400">
                        <Info className="h-4 w-4 opacity-50" />
                        <span className="text-xs font-medium italic">No holidays or events</span>
                    </div>
                ) : (
                    dayEvents.map((h, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <Badge className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border shrink-0",
                                h.category?.toLowerCase() === 'national' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : 
                                h.category?.toLowerCase() === 'maharashtra' ? "bg-orange-100 text-orange-700 border-orange-200" : 
                                h.category?.toLowerCase() === 'karnataka' ? "bg-sky-100 text-sky-700 border-sky-200" : 
                                h.category?.toLowerCase() === 'holiday' || h.category?.toLowerCase() === 'school holiday' ? "bg-rose-100 text-rose-700 border-rose-200" :
                                h.category?.toLowerCase() === 'event' ? "bg-indigo-100 text-indigo-700 border-indigo-200" : 
                                "bg-slate-100 text-slate-700 border-slate-200"
                            )}>
                                {h.category}
                            </Badge>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-1">
                                {h.label}
                            </span>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
