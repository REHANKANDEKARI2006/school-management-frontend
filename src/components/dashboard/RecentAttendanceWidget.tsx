"use client";

import { ClipboardCheck, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

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
    <div className="bg-white p-6 rounded-[12px] border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Recent Attendance Marks
        </h3>
        <ClipboardCheck className="h-4 w-4 text-slate-200" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Class</th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Date</th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">P/A</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {attendance.length > 0 ? (
              attendance.map((record, i) => (
                <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-3">
                    <span className="text-xs font-bold text-slate-700">{record.class_name}</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="text-[10px] font-black text-slate-400">
                      {format(new Date(record.date), "MMM dd")}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded leading-none">
                        P:{record.present || 0}
                      </span>
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded leading-none">
                        A:{record.absent || 0}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-400 text-xs font-medium italic">
                  No attendance marked recently
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50">
        <Link 
          href="/main/attendance"
          className="flex items-center justify-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
        >
          Mark New Attendance <ArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  );
};
