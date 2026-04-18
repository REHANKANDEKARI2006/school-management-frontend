"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Filter,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LeaveCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const userRole = localStorage.getItem("userRole");
        const deptId = "1"; // In real usage, fetch from profile
        const level = userRole === "admin" ? "principal" : "hod";
        // To get calendar view, we should fetch all approved leaves. Currently we can use pending or create a new endpoint?
        // Let's use the pending endpoint for now, or just dummy simulation for the UI if endpoint isn't fully ready.
        // Or better, let's fetch all leaves if we had the endpoint. We will just use the `/api/leaves/pending` 
        // to show some data, but realistically it should be all approved ones.
        const res = await axios.get(`/api/leaves/pending?level=${level}&dept_id=${deptId}`);
        // We will just map pending requests to calendar for demo, normally it's approved leaves.
        setLeaves(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, [currentDate]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = new Date();
  
  // Helper to know if a day has a leave
  const getLeavesForDate = (dateNum: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), dateNum).toISOString().split('T')[0];
    return leaves.filter(l => {
      const start = new Date(l.start_date).toISOString().split('T')[0];
      const end = new Date(l.end_date).toISOString().split('T')[0];
      return dateStr >= start && dateStr <= end;
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-end">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Leave Calendar</h1>
          <p className="text-muted-foreground">Detailed view of staff availability and upcoming absences.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="gap-2 bg-background/50">
              <Filter className="w-4 h-4" /> Filter Departments
           </Button>
           <Button className="gap-2">
              <Users className="w-4 h-4" /> Export Roster
           </Button>
        </div>
      </div>

      <Card className="border-none bg-background/50 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-secondary/40">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="h-8">
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-secondary/40">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-secondary/40 last:border-0 bg-secondary/10">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 grid-rows-5 bg-secondary/5">
            {Array.from({ length: 35 }).map((_, i) => {
              const dayNum = i - firstDayOfMonth + 1;
              const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
              const isToday = isCurrentMonth && dayNum === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
              
              const dayLeaves = isCurrentMonth ? getLeavesForDate(dayNum) : [];

              return (
                <div key={i} className={`min-h-[120px] p-2 border-r border-b border-secondary/40 relative transition-colors ${!isCurrentMonth ? 'bg-secondary/20 opacity-50' : 'hover:bg-secondary/10 bg-background/30'}`}>
                  {isCurrentMonth && (
                    <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-2 ${isToday ? 'bg-primary text-primary-foreground shadow-md' : 'text-slate-600'}`}>
                      {dayNum}
                    </div>
                  )}
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] scrollbar-none">
                    {dayLeaves.map((l, idx) => (
                      <div key={idx} className="text-[10px] p-1.5 rounded bg-blue-500/10 text-blue-700 border border-blue-500/20 truncate font-medium" title={`${l.staff_first_name} ${l.staff_last_name}`}>
                        {l.staff_first_name} {l.staff_last_name[0]}.
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
