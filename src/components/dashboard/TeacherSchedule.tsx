"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, BookOpen, User, MapPin, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { getMySchedule } from "@/lib/api/schedule";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TeacherScheduleProps {
  staffId?: number | string;
  substituteInfo?: any[];
}

export const TeacherSchedule = ({ staffId, substituteInfo = [] }: TeacherScheduleProps) => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1);
  const [viewType, setViewType] = useState<"day" | "week">("day");

  // REAL-TIME DATE CALCULATION
  const [weekDates, setWeekDates] = useState<any[]>([]);

  useEffect(() => {
    const generateDates = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
      const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      
      const dates = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return {
          id: i + 1,
          name: dayNames[i],
          date: `${d.getDate()} ${monthNames[d.getMonth()]}`,
          fullDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        };
      });
      setWeekDates(dates);
      return dates;
    };

    generateDates();
    const interval = setInterval(generateDates, 60000); // Check date rollover every minute
    return () => clearInterval(interval);
  }, []);

  const fetchSchedule = async () => {
    if (!staffId || weekDates.length === 0) return;
    try {
      const mondayDateStr = weekDates[0].fullDate;
      const data = await getMySchedule({ 
        staff_id: Number(staffId), 
        week_start: mondayDateStr 
      });
      setSchedules(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch teacher schedule:", error);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSchedule();
    
    // Pure Real-Time Polling every 10 seconds
    const interval = setInterval(fetchSchedule, 10000); 
    return () => clearInterval(interval);
  }, [staffId, weekDates]);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m}${ampm}`;
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const getFilteredSchedulesForDay = (schedules: any[], dayId: number, dayDateStr: string) => {
    return schedules
      .filter((s) => {
        if (s.day_of_week !== (dayId > 6 ? 1 : dayId)) return false;
        
        // Dynamic Substitute Overlay Logic
        const subDateObj = s.sub_date ? new Date(s.sub_date) : null;
        const subDateString = subDateObj ? `${subDateObj.getDate()} ${monthNames[subDateObj.getMonth()]}` : null;
        
        // If I am being substituted OUT on this specific date, hide the class for me
        if (Number(s.original_staff_id) === Number(staffId) && subDateString === dayDateStr) return false;
        
        // If I am substituting IN, only show this class on the specific date I am substituting
        if (Number(s.substitute_staff_id) === Number(staffId) && subDateString !== dayDateStr) return false;
        
        return true;
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };
  
  const selectedDayDateStr = weekDates.find(d => d.id === selectedDay)?.date || "";
  const daySchedules = getFilteredSchedulesForDay(schedules, selectedDay, selectedDayDateStr);

  const isSubstitute = (schedule: any) => {
    return Number(schedule.substitute_staff_id) === Number(staffId);
  };

  if (loading || weekDates.length === 0) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 -mt-2">
      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
         <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Teacher Timetable</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viewType === "day" ? "Today's Schedule" : "Weekly Overview"}</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button 
                  onClick={() => setViewType("day")}
                  className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${viewType === "day" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
               >
                  DAY
               </button>
               <button 
                  onClick={() => setViewType("week")}
                  className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${viewType === "week" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
               >
                  WEEK
               </button>
            </div>
            <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full ring-1 ring-blue-100">Live View</div>
         </div>
      </div>

      <AnimatePresence mode="wait">
        {viewType === "day" ? (
          <motion.div
            key="day-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col gap-6"
          >
            {/* DAY SELECTOR (Real-time Dates) */}
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-[2rem] p-1.5 shadow-sm max-w-2xl mx-auto w-full">
              {weekDates.map((day) => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day.id)}
                  className={`flex flex-col items-center justify-center py-2 px-6 rounded-[1.5rem] transition-all flex-1 gap-1 ${
                    selectedDay === day.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-100 ring-2 ring-blue-100"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-[12px] font-black uppercase tracking-tight">{day.name}</span>
                  <span className={`text-[10px] font-bold ${selectedDay === day.id ? "text-blue-200" : "text-slate-400"}`}>
                    {day.date}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-0 pt-4">
              {/* LEFT COLUMN: CLASSES */}
              <div className="w-32 flex flex-col gap-0 border-r border-slate-100">
                {daySchedules.length > 0 ? (
                  daySchedules.map((_, idx) => (
                    <div key={idx} className={`h-[140px] flex items-center justify-center relative ${idx === 0 ? 'bg-blue-50/20' : ''}`}>
                      <span className="text-sm font-black text-slate-800 rotate-[-90deg] md:rotate-0">Class {idx + 1}</span>
                      {idx === 0 && <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                    </div>
                  ))
                ) : (
                  <div className="h-[200px] flex items-center justify-center">
                    <span className="text-xs font-black text-slate-200 uppercase tracking-widest">NONE</span>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: CARDS */}
              <div className="flex-1 flex flex-col gap-0 border-l border-slate-100">
                {daySchedules.length > 0 ? (
                  daySchedules.map((item, idx) => {
                    const sub = isSubstitute(item);
                    if (item.is_event_period) {
                      return (
                        <div key={item.schedule_id} className="p-5 border-b border-slate-50 last:border-0 h-[140px] flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-500 bg-blue-50/20">
                           <div className="flex justify-between items-start">
                             <div className="flex flex-col gap-2">
                               <div className="flex items-center gap-3">
                                  <Badge className="bg-blue-600 text-white border-none rounded-md px-2 py-0.5 text-[10px] uppercase font-black tracking-widest">{item.event_type || 'Event'}</Badge>
                                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Period {item.period_number} Override</span>
                               </div>
                               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{item.event_name}</h3>
                               
                               <div className="flex items-center gap-3">
                                  <div className="flex -space-x-2">
                                     <Avatar className="h-6 w-6 border-2 border-white">
                                        <AvatarFallback className="text-[8px] font-bold bg-blue-100 text-blue-600">EV</AvatarFallback>
                                     </Avatar>
                                  </div>
                                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                     Coordinator: {item.coordinator_first_name} {item.coordinator_last_name}
                                  </span>
                               </div>
                             </div>
                             <div className="text-right">
                               <div className="text-sm font-black text-blue-600">{formatTime(item.start_time)} - {formatTime(item.end_time)}</div>
                               <Badge variant="outline" className="border-blue-200 text-blue-500 font-black text-[9px] mt-1 uppercase tracking-tighter">Event Protocol</Badge>
                             </div>
                           </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={item.schedule_id} className={`p-5 border-b border-slate-50 last:border-0 h-[140px] flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-500 ${sub ? 'bg-teal-50/10' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-4">
                              <h3 className="text-xl font-black text-slate-800">{item.subject_name}</h3>
                              {item.is_break && (
                                <span className="text-[9px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 tracking-tighter">Break</span>
                              )}
                              {sub && (
                                <span className="text-[9px] font-black uppercase text-teal-600 bg-teal-50 px-2 py-1 rounded-md border border-teal-100 tracking-tighter">
                                  Substituting for {item.staff_first_name} {item.staff_last_name}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 shadow-sm border border-slate-200">
                                <AvatarImage src={item.profile_url} />
                                <AvatarFallback className="bg-slate-100 font-black">{item.staff_first_name?.substring(0,1)}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-600">
                                    {sub ? "You (Substitute)" : `${item.staff_first_name} ${item.staff_last_name}`}
                                  </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-black text-slate-800">{formatTime(item.start_time)} - {formatTime(item.end_time)}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Period {item.period_number}</div>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50/50 px-3 py-2 rounded-xl">
                            <MapPin size={12} className="text-blue-400" />
                            {item.class_name} {item.section_name} {item.room_name ? `• Room ${item.room_name}` : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-40 bg-slate-50/20 rounded-[2rem] border border-dashed border-slate-100">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                      <CalendarIcon size={40} className="text-blue-100" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">No Classes Today</h3>
                    <p className="text-slate-400 text-sm font-bold mt-2 max-w-[280px] text-center">Your schedule is currently clear for this day.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="week-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-6 gap-2 pt-4 min-h-[500px]"
          >
            {weekDates.map((day) => {
              const dayItems = getFilteredSchedulesForDay(schedules, day.id, day.date);

              return (
                <div key={day.id} className="flex flex-col gap-2">
                  <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day.name}</div>
                    <div className="text-xs font-black text-slate-800 tracking-tight">{day.date.split(' ')[0]}</div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {dayItems.length > 0 ? (
                      dayItems.map((item, idx) => {
                         const sub = isSubstitute(item);
                         return (
                            <div key={item.schedule_id} className={`p-3 rounded-2xl border ${sub ? 'bg-teal-50 border-teal-100' : 'bg-white border-slate-100 shadow-sm'} flex flex-col gap-1 hover:border-blue-200 transition-colors cursor-pointer`}>
                               <div className="text-[9px] font-black text-blue-500 uppercase flex justify-between">
                                  <span>P{item.period_number}</span>
                                  {sub && <span className="text-teal-600 text-[8px] px-1 bg-teal-100 rounded">SUB</span>}
                               </div>
                               <div className="text-[11px] font-black text-slate-800 leading-tight line-clamp-2">{item.subject_name}</div>
                               <div className="text-[9px] font-bold text-slate-400">{item.class_name}</div>
                               <div className="text-[8px] font-bold text-slate-400 mt-1">{formatTime(item.start_time)}</div>
                            </div>
                         );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 opacity-20">
                         <CalendarIcon size={20} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
