"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  MapPin, 
  MoreVertical,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
} from "lucide-react";
import { getMySchedule } from "@/lib/api/schedule";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TeacherScheduleProps {
  staffId?: number | string;
}

export const TeacherSchedule = ({ staffId }: TeacherScheduleProps) => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekDates, setWeekDates] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewType, setViewType] = useState<"day" | "week">("day");
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const generateDates = () => {
      const now = new Date();
      const currentDay = now.getDay(); 
      const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      
      const dates = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return {
          id: i + 1,
          name: dayNames[i],
          shortName: dayNames[i].substring(0, 3),
          fullDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        };
      });
      setWeekDates(dates);
    };
    generateDates();
  }, []);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!staffId || weekDates.length === 0) return;
      try {
        const data = await getMySchedule({ 
          staff_id: Number(staffId), 
          week_start: weekDates[0].fullDate 
        });
        setSchedules(data || []);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch teacher schedule:", error);
      }
    };
    fetchSchedule();
  }, [staffId, weekDates]);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":");
    return `${h}:${m}`;
  };

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const periods = useMemo(() => Array.from(new Set(schedules.map(s => s.period_number))).sort((a, b) => a - b), [schedules]);
  
  const periodTimes = useMemo(() => periods.map(p => {
    const match = schedules.find(s => s.period_number === p);
    return {
      id: p,
      range: `${formatTime(match?.start_time)} - ${formatTime(match?.end_time)}`,
      start: match?.start_time,
      end: match?.end_time,
      startMin: timeToMinutes(match?.start_time),
      endMin: timeToMinutes(match?.end_time)
    };
  }), [periods, schedules]);

  const colors = [
    "border-blue-500 text-blue-600 bg-blue-50/10",
    "border-amber-500 text-amber-600 bg-amber-50/10",
    "border-rose-500 text-rose-600 bg-rose-50/10",
    "border-emerald-500 text-emerald-600 bg-emerald-50/10",
    "border-indigo-500 text-indigo-600 bg-indigo-50/10",
    "border-cyan-500 text-cyan-600 bg-cyan-50/10",
  ];

  if (loading) {
    return <div className="h-[400px] flex items-center justify-center text-slate-400 text-xs font-black uppercase tracking-widest animate-pulse">Synchronizing Timetable...</div>;
  }

  const getTimeLinePositionWeek = () => {
    const currentDay = currentTime.getDay(); 
    if (currentDay === 0) return null; 
    const nowStr = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}:00`;
    
    let activePeriodIdx = -1;
    let progressWithinPeriod = 0;
    for (let i = 0; i < periodTimes.length; i++) {
      const p = periodTimes[i];
      if (nowStr >= p.start && nowStr <= p.end) {
        activePeriodIdx = i;
        const startTotal = timeToMinutes(p.start);
        const endTotal = timeToMinutes(p.end);
        const nowTotal = currentTime.getHours() * 60 + currentTime.getMinutes();
        progressWithinPeriod = (nowTotal - startTotal) / (endTotal - startTotal);
        break;
      }
    }
    if (activePeriodIdx === -1) return null;
    return 40 + (activePeriodIdx * 120) + (progressWithinPeriod * 120);
  };

  const daySchedules = schedules.filter(s => s.day_of_week === selectedDay);
  const minDayTime = periodTimes.length > 0 ? Math.min(...periodTimes.map(p => p.startMin)) - 30 : 480;
  const maxDayTime = periodTimes.length > 0 ? Math.max(...periodTimes.map(p => p.endMin)) + 30 : 1080;
  const totalDuration = maxDayTime - minDayTime;

  const timeMarkers = [];
  for (let t = Math.ceil(minDayTime/60)*60; t <= maxDayTime; t += 60) {
    const hour = Math.floor(t/60);
    const displayHour = hour % 12 || 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    timeMarkers.push({ min: t, label: `${displayHour}:00 ${ampm}` });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
             <CalendarIcon className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Academic Timetable</h2>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 self-start sm:self-auto">
          <button 
            onClick={() => setViewType("day")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
              viewType === "day" ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <List className="h-3.5 w-3.5" /> Daily
          </button>
          <button 
            onClick={() => setViewType("week")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
              viewType === "week" ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Weekly
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewType === "week" ? (
          <motion.div key="week" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="overflow-x-auto scrollbar-hide">
            <div className="w-full relative">
              <table className="w-full min-w-[800px] border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="w-[4rem] p-2 text-center border-b border-r border-slate-200"></th>
                    {weekDates.map(day => (
                      <th key={day.id} className="p-2 text-center border-b border-r border-slate-200 last:border-r-0">
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{day.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periodTimes.map((period, pIdx) => (
                    <tr key={period.id} className="h-[80px]">
                      <td className="p-1 border-b border-r border-slate-200 text-center bg-slate-50/20">
                        <span className="text-[8px] font-black text-slate-400 uppercase [writing-mode:vertical-rl] rotate-180">Slot {pIdx + 1}</span>
                      </td>
                      {weekDates.map((day, dIdx) => {
                        const item = schedules.find(s => s.day_of_week === day.id && s.period_number === period.id);
                        const colorClass = colors[(pIdx + dIdx) % colors.length];
                        return (
                          <td key={day.id} className="p-1 border-b border-r border-slate-200 last:border-r-0 relative group">
                            {item ? (
                              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={cn("h-full p-2 rounded-lg border-l-2 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between group", colorClass.split(' ')[0])}>
                                <div className="min-w-0">
                                  <h4 className={cn("text-[10px] font-black truncate uppercase tracking-tight", colorClass.split(' ')[1])}>{item.subject_name}</h4>
                                  <div className="flex flex-col gap-0.5 mt-0.5">
                                    <span className="text-[8px] font-bold text-slate-400">{item.class_name}-{item.section_name}</span>
                                  </div>
                                </div>
                                <div className="mt-auto">
                                  <span className={cn("text-[8px] font-black", colorClass.split(' ')[1])}>{period.range}</span>
                                </div>
                              </motion.div>
                            ) : (
                              <div className="h-full w-full opacity-[0.02] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)", backgroundSize: "8px 8px" }} />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div key="day" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4">
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {weekDates.map((day) => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day.id)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border shrink-0",
                    selectedDay === day.id ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-100" : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"
                  )}
                >
                  {day.name}
                </button>
              ))}
            </div>

            <div className="relative border border-slate-200 rounded-xl bg-slate-50/30 overflow-hidden overflow-x-auto scrollbar-hide">
              <div className="min-w-[800px]">
                <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">
                  <div className="w-28 shrink-0 p-4 border-r border-slate-200 bg-slate-50/50" />
                  <div className="flex-1 relative h-12">
                    {timeMarkers.map(m => (
                      <div key={m.min} className="absolute top-0 border-l border-slate-200 h-full flex items-center px-2" style={{ left: `${((m.min - minDayTime) / totalDuration) * 100}%` }}>
                        <span className="text-[9px] font-black text-slate-400 uppercase">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                {periodTimes.map((period, pIdx) => {
                  const item = daySchedules.find(s => s.period_number === period.id);
                  const colorClass = colors[pIdx % colors.length];
                  return (
                    <div key={period.id} className="flex min-h-[85px] border-b border-slate-200 last:border-b-0 group">
                      <div className="w-28 shrink-0 p-4 border-r border-slate-200 bg-white flex flex-col justify-center items-center gap-1 group-hover:bg-slate-50 transition-colors">
                        <span className="text-[11px] font-black text-slate-800 uppercase">Slot {pIdx + 1}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap">{period.range}</span>
                      </div>
                      <div className="flex-1 relative bg-white/50 group-hover:bg-white/80 transition-colors overflow-hidden">
                        {/* Vertical Grid Lines */}
                        {timeMarkers.map(m => (
                          <div key={m.min} className="absolute top-0 bottom-0 border-l border-slate-200 w-px z-0" style={{ left: `${((m.min - minDayTime) / totalDuration) * 100}%` }} />
                        ))}
                        {item && (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: pIdx * 0.05 }} className={cn("absolute top-3 bottom-3 rounded-xl border-l-4 shadow-md flex flex-col justify-center px-5 hover:shadow-lg transition-all z-20 cursor-default min-w-[150px]", colorClass)} style={{ left: `${((period.startMin - minDayTime) / totalDuration) * 100}%`, width: `${((period.endMin - period.startMin) / totalDuration) * 100}%` }}>
                             <h4 className={cn("text-sm font-black uppercase tracking-tight leading-tight", colorClass.split(' ')[1])}>{item.subject_name}</h4>
                             <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 truncate">{item.class_name}-{item.section_name}</p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
