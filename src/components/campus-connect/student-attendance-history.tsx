
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { type Student } from "@/types";
import { Check, X, CalendarClock, Loader2, Calendar as CalendarIcon } from "lucide-react";
import axios from "@/lib/axios";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

interface AttendanceHistoryProps {
  student: Student;
}

type HistoricalRecord = {
  date: string;
  subjectName: string;
  status: 'present' | 'absent' | 'pending' | 'not_taken';
  startTime?: string;
  endTime?: string;
  periodNumber?: number;
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case "present": return "default";
        case "absent": return "destructive";
        case "pending": return "secondary";
        default: return "outline";
    }
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case "present": return <Check className="h-3 w-3 mr-1" />;
        case "absent": return <X className="h-3 w-3 mr-1" />;
        case "pending": return <CalendarClock className="h-3 w-3 mr-1" />;
        default: return null;
    }
}

export function StudentAttendanceHistory({ student }: AttendanceHistoryProps) {
  const [history, setHistory] = React.useState<HistoricalRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

  React.useEffect(() => {
    const fetchHistory = async () => {
      if (!student?.id || !selectedDate) return;
      
      try {
        setLoading(true);
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const res = await axios.get(`/api/attendance/student/${student.id}?date=${dateStr}`);
        if (res.data.success) {
          setHistory(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch attendance history", err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [student, selectedDate]);

  const recordsForDate = React.useMemo(() => {
    return history;
  }, [history]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-12 animate-in fade-in duration-500">
      {/* CALENDAR PANEL */}
      <div className="md:w-auto shrink-0 space-y-6">
        <Card className="shadow-none border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
          <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/20 py-3.5">
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
              <CalendarIcon className="h-3.5 w-3.5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border-none p-0"
            />
          </CardContent>
        </Card>
      </div>

      {/* TIMETABLE PANEL */}
      <div className="flex-1 space-y-4 min-w-0">
        <Card className="shadow-none border-slate-200 dark:border-slate-800 h-full flex flex-col bg-white dark:bg-slate-900/50">
          <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/20 py-4 px-6">
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
              <CalendarClock className="h-3.5 w-3.5" />
              {selectedDate ? format(selectedDate, "PPPP") : "Daily Schedule"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {!selectedDate ? (
              <div className="h-full flex items-center justify-center p-12 text-center text-slate-400 text-sm">
                 Please select a date from the calendar.
              </div>
            ) : recordsForDate.length > 0 ? (
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                  <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                    <TableHead className="w-[100px] px-6 text-xs font-bold uppercase tracking-wider text-slate-400">Period</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Time Slot</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Subject</TableHead>
                    <TableHead className="text-right px-6 text-xs font-bold uppercase tracking-wider text-slate-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordsForDate.map((record: any, index) => {
                    const startTime = record.startTime || record.start_time;
                    const endTime = record.endTime || record.end_time;
                    const periodNumber = record.periodNumber || record.period_number || (index + 1);
                    const status = record.status || "not_taken";
                    
                    const formattedTime = startTime && endTime 
                      ? `${startTime.slice(0,5)} - ${endTime.slice(0,5)}` 
                      : "-";

                    return (
                      <TableRow key={index} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/30 dark:hover:bg-slate-800/10 h-16">
                        <TableCell className="font-bold text-slate-400 tabular-nums text-sm px-6">
                          P{periodNumber}
                        </TableCell>
                        <TableCell className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                          {formattedTime}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {record.subjectName}
                        </TableCell>
                        <TableCell className="text-right px-6">
                           <Badge variant={getStatusVariant(status)} className="capitalize px-3 py-1 text-[11px] font-bold tracking-tight shadow-none border-none">
                             {getStatusIcon(status)}
                             {status.replace('_', ' ')}
                           </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                  <CalendarClock className="h-6 w-6 text-slate-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Schedule Found</p>
                  <p className="text-xs text-slate-400">No classes are scheduled on this date.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
