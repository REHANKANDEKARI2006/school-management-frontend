"use client";

import { FileEdit, CheckCircle2, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl h-full flex flex-col">
      <CardHeader className="p-4 pb-2 shrink-0">
        <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
          Evaluation Pending
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-grow flex flex-col">
        <div className="flex-1 space-y-2">
          {pendingMarks.length > 0 ? (
            pendingMarks.slice(0, 3).map((marks, i) => (
              <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-slate-50/50 border border-slate-100">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                  <FileEdit className="h-4 w-4 text-rose-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[11px] font-black text-slate-700 truncate">{marks.exam_name}</h4>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                    {marks.class_name} • {marks.subject_name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[9px] font-bold text-slate-400">
                    <Calendar size={10} /> {format(new Date(marks.date), "MMM dd")}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 mb-2" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">All Updated</p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-50">
          <Link 
            href="/main/exams"
            className="flex items-center justify-center gap-1.5 text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
          >
            Enter Marks <FileEdit size={10} />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
