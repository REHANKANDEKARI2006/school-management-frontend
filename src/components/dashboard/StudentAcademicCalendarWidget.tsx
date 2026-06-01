"use client";

import * as React from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AcademicCalendarWidgetProps {
  selectedDate?: Date;
  onSelect?: (date: Date) => void;
  events?: any[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function StudentAcademicCalendarWidget({ 
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
      <div className="flex items-center justify-between px-2 py-3 bg-white">
        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-[13px] font-black text-slate-700 tracking-wider uppercase select-none">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return (
      <div className="grid grid-cols-7 mb-4 mt-2 select-none">
        {days.map((d, i) => (
          <div key={d} className={cn(
              "text-center text-[9px] font-extrabold tracking-wider",
              i === 0 ? "text-rose-500" : "text-slate-400"
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
              "relative min-h-[44px] flex flex-col items-center justify-center cursor-pointer transition-all group select-none",
              !isCurrentMonth && "opacity-20 pointer-events-none"
            )}
            onClick={() => setSelectedDate(d)}
          >
            {isSelected && (
              <motion.div 
                layoutId="student-pill"
                className="absolute h-8 w-8 bg-[#3F4DF7] rounded-full z-0 shadow-sm border border-blue-500/20" 
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}

            <div className="relative z-10 flex flex-col items-center justify-center">
                <span className={cn(
                  "text-[12px] font-black tabular-nums leading-none",
                  isSelected ? "text-white" : isSunday ? "text-rose-500" : "text-slate-800"
                )}>
                  {format(d, "d")}
                </span>

                 <div className="flex gap-0.5 mt-1 h-1 items-center justify-center">
                    {dayEvents.slice(0, 3).map((h, idx) => (
                      <div key={idx} className={cn(
                          "h-[4px] w-[4px] rounded-full",
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
        <div className="grid grid-cols-7 gap-y-1" key={currentDay.toString()}>
          {days}
        </div>
      );
    }
    return <div className="space-y-1">{rowItems}</div>;
  };

  return (
    <div className="w-full bg-white border-none shadow-none overflow-visible">
      {renderHeader()}
      <div className="p-1">
        {renderDays()}
        {renderCells()}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-y-1.5 py-4 border-t border-slate-100 bg-white px-2 select-none">
         <div className="flex items-center gap-1">
            <span className="text-[7px] text-emerald-500">●</span>
            <span className="text-[7.5px] font-black text-slate-400 tracking-wider">NATIONAL</span>
         </div>
         <div className="flex items-center gap-1">
            <span className="text-[7px] text-orange-500">●</span>
            <span className="text-[7.5px] font-black text-slate-400 tracking-wider">MAHARASHTRA</span>
         </div>
         <div className="flex items-center gap-1">
            <span className="text-[7px] text-sky-400">●</span>
            <span className="text-[7.5px] font-black text-slate-400 tracking-wider">KARNATAKA</span>
         </div>
         <div className="flex items-center gap-1">
            <span className="text-[7px] text-rose-500">●</span>
            <span className="text-[7.5px] font-black text-slate-400 tracking-wider">HOLIDAY</span>
         </div>
         <div className="flex items-center gap-1">
            <span className="text-[7px] text-indigo-600">●</span>
            <span className="text-[7.5px] font-black text-slate-400 tracking-wider">EVENT</span>
         </div>
      </div>
    </div>
  );
}

export function StudentCalendarDayDetail({ date, events = [] }: { date: Date; events?: any[] }) {
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
        <Card className="border border-slate-100/80 shadow-sm bg-white overflow-hidden rounded-2xl p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">
                Selected Date
            </p>
            <h3 className="text-sm font-black text-slate-800 mt-1 mb-4 select-none">
                {format(date, "EEEE, d MMMM yyyy")}
            </h3>
            <div className="space-y-3">
                {dayEvents.length === 0 ? (
                    <div className="flex items-center gap-2 text-slate-400/80 select-none py-1">
                        <Info className="h-4 w-4 stroke-[2.5]" />
                        <span className="text-[12px] font-bold italic">No holidays or events</span>
                    </div>
                ) : (
                    dayEvents.map((h, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                             <Badge className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border shrink-0",
                                h.category?.toLowerCase() === 'national' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                                h.category?.toLowerCase() === 'maharashtra' ? "bg-orange-50 text-orange-700 border-orange-100" : 
                                h.category?.toLowerCase() === 'karnataka' ? "bg-sky-50 text-sky-700 border-sky-100" : 
                                h.category?.toLowerCase() === 'holiday' || h.category?.toLowerCase() === 'school holiday' ? "bg-rose-50 text-rose-700 border-rose-100" :
                                h.category?.toLowerCase() === 'event' ? "bg-indigo-50 text-indigo-700 border-indigo-100" : 
                                "bg-slate-50 text-slate-750 border-slate-100"
                            )}>
                                {h.category}
                            </Badge>
                            <span className="text-xs font-bold text-slate-700 line-clamp-1">
                                {h.label}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
