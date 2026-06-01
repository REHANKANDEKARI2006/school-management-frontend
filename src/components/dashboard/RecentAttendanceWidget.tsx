"use client";

import { ClipboardCheck, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentAttendanceWidgetProps {
  attendance?: {
    class_name: string;
    date: string;
    present: number;
    absent: number;
  }[];
}

export const RecentAttendanceWidget = ({ attendance = [] }: RecentAttendanceWidgetProps) => {
  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl h-full flex flex-col">
      <CardHeader className="p-4 pb-2 shrink-0">
        <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
          Recent Activity
          <ClipboardCheck className="h-4 w-4 text-slate-300" />
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-grow">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Class</th>
                <th className="pb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Date</th>
                <th className="pb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">P/A</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {attendance.length > 0 ? (
                attendance.slice(0, 4).map((record, i) => (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-2">
                      <span className="text-[11px] font-bold text-slate-700">{record.class_name}</span>
                    </td>
                    <td className="py-2 text-center">
                      <span className="text-[9px] font-black text-slate-400">
                        {format(new Date(record.date), "MMM dd")}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[9px] font-black text-emerald-600">P:{record.present}</span>
                        <span className="text-[9px] font-black text-rose-400">A:{record.absent}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-400 text-[10px] font-medium">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-50">
          <Link 
            href="/main/attendance"
            className="flex items-center justify-center gap-1.5 text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
          >
            Mark Attendance <ArrowUpRight size={10} />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
