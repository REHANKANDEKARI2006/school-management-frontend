"use client";

import React from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface AttendanceAlertsProps {
  students: Array<{
    student_id: number;
    name: string;
    class_name: string;
    percentage: number;
  }>;
}

export const AttendanceAlerts = ({ students }: AttendanceAlertsProps) => {
  return (
    <Card className="rounded-xl border-slate-100 shadow-sm overflow-hidden bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-black text-slate-800 tracking-tight">Attendance Alerts</CardTitle>
        <div className="bg-rose-50 p-2 rounded-xl text-rose-600">
          <AlertTriangle className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-6">
        <div className="flex flex-col gap-1">
          {students.length > 0 ? (
            students.map((student, idx) => (
              <Link
                key={idx}
                href={`/main/students/${student.student_id}/attendance`}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-rose-50/30 transition-colors group"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-800 tracking-tight">{student.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{student.class_name} • <span className="text-rose-600">{student.percentage}%</span></span>
                </div>
                <div className="bg-rose-100 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-3 h-3 text-rose-600" />
                </div>
              </Link>
            ))
          ) : (
            <div className="p-4 text-center">
              <p className="text-xs font-bold text-slate-400">All students have good attendance!</p>
            </div>
          )}
        </div>
        <div className="px-4 pt-1">
           <Link href="/main/attendance/reports" className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">View Full List</Link>
        </div>
      </CardContent>
    </Card>
  );
};
