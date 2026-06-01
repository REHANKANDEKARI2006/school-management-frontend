"use client";

import { AlertTriangle, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AttendanceAlertsWidgetProps {
  students?: {
    name: string;
    class: string;
    percentage: number;
  }[];
}

export const AttendanceAlertsWidget = ({ students = [] }: AttendanceAlertsWidgetProps) => {
  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl h-full flex flex-col">
      <CardHeader className="p-6 pb-2 shrink-0">
        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
          Attendance Alerts
          <AlertTriangle className="h-4 w-4 text-rose-300" />
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 pt-0 flex-grow flex flex-col">
        <div className="flex-1 space-y-3">
          {students.length > 0 ? (
            students.map((student, i) => {
              const isCritical = student.percentage < 60;
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center font-bold text-[10px]",
                      isCritical ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {student.percentage}%
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-bold text-slate-700 truncate">{student.name}</h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase">{student.class}</p>
                    </div>
                  </div>
                  
                  <div className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                      isCritical ? "text-rose-600 bg-rose-50" : "text-amber-600 bg-amber-50"
                  )}>
                      {isCritical ? "Critical" : "Warning"}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-emerald-600 text-sm font-bold">All students have good attendance</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-50">
          <Link 
            href="/main/attendance"
            className="flex items-center justify-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
          >
            View Full List <ChevronRight size={12} />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
