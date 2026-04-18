"use client";

import { FileEdit, CheckCircle2, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface PendingMarksWidgetProps {
  pendingMarks?: {
    exam_name: string;
    class_name: string;
    subject_name: string;
    date: string;
  }[];
}

export const PendingMarksWidget = ({ pendingMarks = [] }: PendingMarksWidgetProps) => {
  return (
    <div className="bg-white p-6 rounded-[12px] border border-slate-100 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Pending Marks Entry
        </h3>
        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
      </div>

      <div className="flex-1 space-y-4">
        {pendingMarks.length > 0 ? (
          pendingMarks.map((marks, i) => (
            <div key={i} className="flex gap-4 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                <FileEdit className="h-5 w-5 text-rose-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-slate-700 truncate">{marks.exam_name}</h4>
                  <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded uppercase">Urgent</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                  {marks.class_name} • {marks.subject_name}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[9px] font-bold text-slate-400">
                  <Calendar size={12} className="text-slate-300" />
                  Due: {format(new Date(marks.date), "MMM dd, yyyy")}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-emerald-600 text-sm font-bold">All marks are up to date</p>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Excellent work!</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50">
        <Link 
          href="/main/exams"
          className="flex items-center justify-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
        >
          Enter Marks <FileEdit size={12} />
        </Link>
      </div>
    </div>
  );
};
