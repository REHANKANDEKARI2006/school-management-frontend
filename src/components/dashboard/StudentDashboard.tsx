"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Bell,
  CheckCircle2,
  RefreshCcw
} from "lucide-react";
import api from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageSkeleton } from "@/components/ui/skeletons";
import { Announcements } from "./Announcements";
import { StudentStatsBar } from "./StudentStatsBar";
import { StudentQuickActions } from "./StudentQuickActions";
import { StatsCard } from "./StatsCard";
import { AcademicCalendarWidget, CalendarDayDetail } from "@/components/campus-connect/academic-calendar-widget";
import { Button } from "@/components/ui/button";

export const StudentDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/dashboard/student");
      if (res.data.success) {
        setData(res.data.data);
        setError(null);
      }
    } catch (error: any) {
      console.error("Failed to fetch student dashboard data:", error);
      setError(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // 60s refresh
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <PageSkeleton rows={15} />;
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-[#F8FAFC]">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
          <p className="text-slate-500 text-sm max-w-xs">{error}</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" className="gap-2 border-slate-200">
          <RefreshCcw className="h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    );
  }

  if (!data) return <div className="p-10 text-center text-gray-500">No data available.</div>;

  const { profile, stats, timetable, attendanceOverview, recentResults, notices } = data;

  return (
    <div className="bg-[#F8FAFC] -m-4 sm:-m-6 min-h-screen p-6 md:p-8 lg:p-10 animate-in fade-in duration-500">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* ZONE 1: STUDENT STATS BAR (WELCOME + QUICK STATS) */}
        <StudentStatsBar profile={profile} stats={stats} timetable={timetable} />

        {/* ZONE 2: STUDENT QUICK ACTIONS */}
        <StudentQuickActions />

        {/* MAIN CONTENT GRID (ZONE 3, 4, 5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Main Academic Content (8/12) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* ZONE 3: TODAY'S TIMETABLE */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-blue-50 shadow-sm space-y-8 relative overflow-hidden">
               <div className="flex justify-between items-center relative z-10">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold flex items-center gap-3 text-slate-800">
                      <Clock className="w-6 h-6 text-blue-500" /> Today's Schedule
                    </h2>
                    <p className="text-xs text-slate-400 font-medium ml-9">Stay on track with your daily classes</p>
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50 px-4 py-1.5 rounded-full font-bold">
                    {timetable.length} Sessions
                  </Badge>
               </div>
               
               {timetable.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                   {timetable.map((item: any, idx: number) => {
                     if (item.is_event_period) {
                       return (
                         <motion.div 
                           initial={{ opacity: 0, x: -10 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: idx * 0.1 }}
                           key={idx} 
                           className="bg-blue-600 p-5 rounded-[2rem] border border-blue-500 shadow-xl shadow-blue-100 flex items-center gap-6 relative overflow-hidden group"
                         >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl" />
                            <div className="flex flex-col items-center justify-center bg-white/20 rounded-2xl p-3 border border-white/20 backdrop-blur-sm">
                              <span className="text-[10px] font-black uppercase leading-none text-white">{item.start_time.split(":")[0]}</span>
                              <span className="text-[10px] font-black uppercase leading-none mt-1 text-blue-100">{item.start_time.split(":")[1]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                 <Badge className="bg-white/20 text-white border-none rounded-full px-2 py-0 h-4 text-[8px] uppercase font-black tracking-widest">{item.event_type || 'EVENT'}</Badge>
                              </div>
                              <h3 className="font-black text-white truncate text-lg uppercase tracking-tight">{item.event_name}</h3>
                              <p className="text-[10px] font-bold text-blue-100 flex items-center gap-1.5 mt-0.5">
                                Coord: {item.coordinator_first_name} {item.coordinator_last_name}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-black text-blue-200 uppercase tracking-widest leading-none mb-1">Period {item.period_number}</div>
                              <div className="text-xs font-black text-white">{item.start_time.substring(0, 5)}</div>
                            </div>
                         </motion.div>
                       );
                     }

                     return (
                       <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          key={idx} 
                          className={`flex items-center gap-4 p-5 rounded-[2rem] border transition-all group overflow-hidden relative ${
                            item.is_substitute 
                              ? "bg-purple-50/80 border-purple-200 hover:bg-purple-100 hover:border-purple-300 shadow-sm" 
                              : "bg-slate-50/50 border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-md"
                          }`}
                       >
                          {item.is_substitute && (
                            <div className="absolute top-0 right-0 py-1 px-3 bg-purple-600 text-[8px] font-black text-white uppercase tracking-widest rounded-bl-xl">SUBSTITUTE</div>
                          )}
                          <div className={`flex flex-col items-center justify-center bg-white rounded-2xl p-3 border shadow-sm transition-colors ${
                            item.is_substitute 
                              ? "border-purple-100 group-hover:bg-purple-600 group-hover:border-purple-600" 
                              : "border-slate-100 group-hover:bg-blue-600 group-hover:border-blue-600"
                          }`}>
                            <span className={`text-[10px] font-black uppercase leading-none ${
                              item.is_substitute ? "text-purple-600 group-hover:text-white" : "text-blue-600 group-hover:text-white"
                            }`}>{item.start_time.split(":")[0]}</span>
                            <span className={`text-[10px] font-black uppercase leading-none mt-1 ${
                              item.is_substitute ? "text-purple-300 group-hover:text-purple-200" : "text-slate-400 group-hover:text-blue-200"
                            }`}>{item.start_time.split(":")[1]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-bold truncate transition-colors ${
                              item.is_substitute ? "text-purple-900 group-hover:text-purple-700" : "text-slate-800 group-hover:text-blue-700"
                            }`}>{item.subject_name}</h3>
                            <p className={`text-[11px] font-bold flex items-center gap-1.5 mt-0.5 ${
                              item.is_substitute ? "text-purple-600" : "text-slate-400"
                            }`}>
                              <User className={`w-3 h-3 ${item.is_substitute ? "text-purple-500" : "text-blue-500"}`} /> {item.teacher_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={`bg-white shadow-sm font-bold ${
                              item.is_substitute ? "text-purple-600 border-purple-100" : "text-slate-500 border-slate-100"
                            }`}>
                              {item.end_time.substring(0, 5)}
                            </Badge>
                          </div>
                       </motion.div>
                     );
                   })}
                 </div>
               ) : (
                 <div className="py-16 text-center space-y-4 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Calendar className="w-10 h-10 text-slate-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-600 font-bold text-lg">No classes scheduled</p>
                      <p className="text-slate-400 text-sm font-medium">Enjoy your free time or catch up on studies!</p>
                    </div>
                 </div>
               )}
            </div>

            {/* ZONE 4: RESULTS & FEES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* FEE STATUS (REDESIGNED - NO PAY BUTTON) */}
               <div className="bg-white p-8 rounded-[2.5rem] border border-blue-50 shadow-sm space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <CreditCard className="w-24 h-24 -mr-8 -mt-8 rotate-12" />
                  </div>
                  <h2 className="text-xl font-bold flex items-center gap-3 text-slate-800">
                    <CreditCard className="w-6 h-6 text-emerald-500" /> Fee Summary
                  </h2>
                  {stats.pendingFees > 0 ? (
                    <div className="space-y-6">
                      <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-16 h-16 bg-rose-100/50 rounded-full -mr-8 -mt-8" />
                         <p className="text-[10px] text-rose-500 font-black uppercase tracking-[0.2em] mb-2 relative z-10">Current Outstanding</p>
                         <p className="text-4xl font-black text-rose-600 relative z-10">₹{stats.pendingFees.toLocaleString()}</p>
                      </div>
                      <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-100/50 text-amber-700">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <p className="text-xs font-bold leading-relaxed">
                          Please contact the accounts office or use the mobile app for fee payments and receipts.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-4 border-2 border-dashed border-emerald-100 rounded-[2.5rem] bg-emerald-50/30">
                       <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm">
                         <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                       </div>
                       <div className="space-y-1">
                         <p className="text-emerald-700 font-black text-xl tracking-tight">Fully Paid!</p>
                         <p className="text-emerald-600/70 text-sm font-bold uppercase tracking-wider">No pending dues</p>
                       </div>
                    </div>
                  )}
               </div>

               {/* RECENT EXAM RESULTS */}
               <div className="bg-white p-8 rounded-[2.5rem] border border-blue-50 shadow-sm space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-3 text-slate-800">
                      <BookOpen className="w-6 h-6 text-purple-500" /> Recent Results
                    </h2>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                  {recentResults.length > 0 ? (
                    <div className="space-y-4">
                      {recentResults.map((res: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-purple-100 transition-all group">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-black text-xs border border-purple-100">
                                {res.subject_name[0]}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-slate-800 group-hover:text-purple-700 transition-colors">{res.subject_name}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">{res.exam_name}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="font-black text-slate-800 text-base">{res.marks_obtained}/{res.total_score}</p>
                              <Badge variant="outline" className="text-[10px] h-4 px-2 border-purple-100 text-purple-600 bg-purple-50 uppercase font-bold">
                                Grade: {res.grade}
                              </Badge>
                           </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center space-y-3">
                       <BookOpen className="w-12 h-12 text-slate-200 mx-auto" />
                       <p className="text-slate-400 font-bold text-sm">No recent results posted.</p>
                    </div>
                  )}
               </div>
            </div>

            {/* ZONE 5: BOTTOM ROW (BALANCING SPACE) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* ANNOUNCEMENTS */}
               <Announcements announcements={notices} />
               
               {/* ATTENDANCE OVERVIEW (MOVED FROM SIDEBAR TO FILL SPACE) */}
               <div className="bg-white p-8 rounded-[2.5rem] border border-blue-50 shadow-sm space-y-8">
                  <h2 className="text-xl font-bold flex items-center gap-3 text-slate-800">
                    <Calendar className="w-6 h-6 text-blue-500" /> Attendance Overview
                  </h2>
                  <div className="flex flex-col items-center gap-8 py-2">
                     <div className="relative h-48 w-48 flex items-center justify-center">
                       <svg className="h-48 w-48 -rotate-90">
                         <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-50" />
                         <circle 
                           cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="16" fill="transparent" 
                           strokeDasharray={552}
                           strokeDashoffset={552 - (552 * attendanceOverview.percentage) / 100}
                           strokeLinecap="round"
                           className={attendanceOverview.percentage >= 75 ? "text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.2)]" : "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]"}
                         />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-5xl font-black text-slate-800 tracking-tighter">{attendanceOverview.percentage}%</span>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Total Score</span>
                       </div>
                     </div>
                     <div className="w-full space-y-4">
                       <div className="flex justify-between items-end">
                         <div className="space-y-1">
                           <p className="text-2xl font-black text-slate-800 leading-none">{attendanceOverview.present}</p>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Days Present</p>
                         </div>
                         <div className="text-right space-y-1">
                           <p className="text-2xl font-black text-slate-800 leading-none">{attendanceOverview.total}</p>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Days</p>
                         </div>
                       </div>
                       <Progress value={attendanceOverview.percentage} className={`h-3 rounded-full ${attendanceOverview.percentage >= 75 ? "bg-blue-100 [&>div]:bg-blue-500" : "bg-amber-100 [&>div]:bg-amber-500"}`} />
                       {attendanceOverview.percentage < 75 && (
                         <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 animate-pulse">
                           <AlertCircle className="w-5 h-5 flex-shrink-0" />
                           <p className="text-xs font-black uppercase tracking-tight">Warning: Attendance below 75% criteria</p>
                         </div>
                       )}
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Performance & Info Sidebar (4/12) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            <div className="bg-white dark:bg-slate-900 overflow-hidden shadow-sm border border-blue-50 rounded-xl">
                <AcademicCalendarWidget 
                  selectedDate={selectedDate} 
                  onSelect={setSelectedDate} 
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                />
            </div>

            <CalendarDayDetail date={selectedDate} />

          </div>
        </div>
      </div>
    </div>
  );
};
