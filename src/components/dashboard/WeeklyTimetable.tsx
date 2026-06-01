"use client";

import React from "react";
import { Clock, BookOpen, User, Utensils } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TimetableEntry {
  start_time: string;
  end_time: string;
  period_number: number;
  subject_name: string;
  teacher_name: string;
  is_substitute?: boolean;
  is_lunch_break?: boolean;
}

interface WeeklyTimetableProps {
  timetable: TimetableEntry[];
  isHoliday?: boolean;
  isSunday?: boolean;
}

export const WeeklyTimetable = ({ timetable = [], isHoliday, isSunday }: WeeklyTimetableProps) => {
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":");
    const hours = parseInt(h);
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${m} ${ampm}`;
  };

  const isClassActive = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return false;
    const now = new Date();
    const currentTimeStr = now.toTimeString().split(" ")[0]; // "HH:MM:SS"
    return currentTimeStr >= startTime && currentTimeStr <= endTime;
  };

  const isClassConcluded = (endTime: string) => {
    if (!endTime) return false;
    const now = new Date();
    const currentTimeStr = now.toTimeString().split(" ")[0]; // "HH:MM:SS"
    return currentTimeStr > endTime;
  };

  // Sort and inject lunch break dynamically
  const getExtendedTimetable = () => {
    const extended = [...timetable];
    
    // Sort chronologically by start_time first to ensure proper injection index
    extended.sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    const hasLunch = extended.some(p => p.is_lunch_break || p.subject_name.toLowerCase().includes('lunch'));
    if (!hasLunch && extended.length > 0) {
      // Find where 12:15:00 should be placed
      const insertIdx = extended.findIndex(p => p.start_time >= "13:00:00");
      const lunchEntry = {
        start_time: "12:15:00",
        end_time: "13:00:00",
        period_number: 0,
        subject_name: "Lunch Break",
        teacher_name: "School Cafeteria",
        is_lunch_break: true
      };
      
      if (insertIdx !== -1) {
        extended.splice(insertIdx, 0, lunchEntry);
      } else {
        const endsAtLunch = extended.some(p => p.end_time === "12:15:00");
        if (endsAtLunch) {
          extended.push(lunchEntry);
        }
      }
    }
    return extended;
  };

  const extendedTimetable = getExtendedTimetable();

  const getHighlightedPeriodIndex = (list: TimetableEntry[]) => {
    const now = new Date();
    const currentTimeStr = now.toTimeString().split(" ")[0]; // "HH:MM:SS"
    
    // 1. Check if there is an active/ongoing period
    const activeIdx = list.findIndex(p => currentTimeStr >= p.start_time && currentTimeStr <= p.end_time);
    if (activeIdx !== -1) return activeIdx;
    
    // 2. If no active period, find the first upcoming period (where start_time > current_time)
    const upcomingIdx = list.findIndex(p => p.start_time > currentTimeStr);
    return upcomingIdx;
  };

  const highlightedIdx = getHighlightedPeriodIndex(extendedTimetable);

  if (!timetable || timetable.length === 0 || isHoliday) {
    return (
      <Card className="rounded-2xl border border-slate-100/80 shadow-sm bg-white overflow-hidden">
        <div className="py-12 text-center space-y-4 bg-slate-50/20 rounded-2xl m-1.5 border border-dashed border-slate-200">
          <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
            <BookOpen className={cn("h-7 w-7", isHoliday ? "text-orange-400" : "text-slate-300")} />
          </div>
          <div className="space-y-1 px-4">
            <h3 className="text-base font-bold text-slate-800">
              {isHoliday ? (isSunday ? "Sunday Off" : "School Closed") : "No Classes Scheduled"}
            </h3>
            <p className="text-slate-400 text-xs font-semibold max-w-xs mx-auto leading-normal">
              {isHoliday 
                ? `Enjoy your ${isSunday ? 'Sunday' : 'Holiday'}! Classes will resume on the next working day.` 
                : "There are no classes scheduled for you today."}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-100/80 shadow-sm bg-white overflow-hidden">
      <div className="p-6 border-b border-slate-100/80 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800">Daily Schedule</h2>
        <Badge variant="outline" className="text-[9px] font-extrabold text-blue-600 bg-blue-50 border-blue-100 uppercase tracking-widest px-2.5 py-0.5 rounded-full select-none">
           {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
        </Badge>
      </div>
      <CardContent className="p-6 space-y-3.5">
      {extendedTimetable.map((period, idx) => {
        const isActive = isClassActive(period.start_time, period.end_time);
        const isConcluded = !isActive && isClassConcluded(period.end_time);
        const isHighlighted = highlightedIdx === idx;
        
        return (
          <div 
            key={idx}
            className={cn(
              "flex items-center gap-5 p-4 rounded-2xl border transition-all duration-300 hover:shadow-md hover:translate-x-0.5",
              isHighlighted 
                ? "bg-emerald-50/20 border-emerald-300 border-l-4 border-l-emerald-500 shadow-sm" 
                : period.is_lunch_break && !isConcluded
                  ? "bg-amber-50/10 border-amber-100/60"
                  : period.is_substitute && !isConcluded
                    ? "bg-indigo-50/20 border-indigo-100 border-l-4 border-l-indigo-500"
                    : isConcluded
                      ? "bg-slate-50/40 border-slate-100/60 opacity-60"
                      : "bg-white border-slate-100/80"
            )}
          >
            {/* TIME COLUMN */}
            <div className={cn(
              "flex flex-col items-center justify-center min-w-[75px] py-1 border-r border-slate-100 pr-5 select-none",
              isConcluded && "opacity-75"
            )}>
              <span className={cn(
                "text-[13px] font-extrabold",
                isConcluded ? "text-slate-400 line-through decoration-slate-400/60" : "text-slate-800"
              )}>{formatTime(period.start_time)}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Start</span>
            </div>

            {/* PERIOD INFO */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md",
                  isHighlighted
                    ? "bg-emerald-100/50 text-emerald-600 border border-emerald-200/50"
                    : period.is_lunch_break && !isConcluded
                      ? "bg-orange-50 text-orange-655 border border-orange-100"
                      : period.is_substitute && !isConcluded
                        ? "bg-indigo-100/50 text-indigo-600 border border-indigo-200/50"
                        : isConcluded
                          ? "bg-slate-100 text-slate-400 border border-slate-200/50"
                          : "bg-blue-50 text-blue-600 border border-blue-100"
                )}>
                  {period.is_lunch_break ? "Lunch" : `Period ${period.period_number}`}
                </span>
                {period.is_substitute && !isConcluded && (
                  <Badge className="bg-indigo-500 text-white text-[8px] px-1.5 py-0 h-4 border-none font-bold uppercase tracking-wider">
                    Substitute
                  </Badge>
                )}
              </div>
              <h3 className={cn(
                "text-[14px] font-extrabold mt-1.5 truncate transition-all duration-300",
                isConcluded ? "text-slate-405 line-through decoration-slate-400/80" : "text-slate-800"
              )}>{period.subject_name}</h3>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  {period.is_lunch_break ? (
                    <>
                      <Utensils size={12} className="text-slate-450" />
                      <span className="text-[10px] font-bold text-slate-400 truncate">School Cafeteria</span>
                    </>
                  ) : (
                    <>
                      <User size={12} className="text-slate-405" />
                      <span className="text-[10px] font-bold text-slate-400 truncate">{period.teacher_name}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-400" />
                  <span className={cn(
                    "text-[10px] font-bold text-slate-400",
                    isConcluded && "line-through decoration-slate-400/50"
                  )}>
                    {formatTime(period.start_time)} - {formatTime(period.end_time)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      </CardContent>
    </Card>
  );
};
