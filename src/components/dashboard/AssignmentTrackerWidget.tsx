"use client";

import { BookOpen, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AssignmentTrackerWidgetProps {
  assignments?: {
    title: string;
    subject: string;
    class: string;
    due_date: string;
    submitted_count: number;
    total_students: number;
  }[];
}

export const AssignmentTrackerWidget = ({ assignments = [] }: AssignmentTrackerWidgetProps) => {
  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl h-full flex flex-col">
      <CardHeader className="p-6 pb-2 shrink-0">
        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
          Assignments Tracker
          <BookOpen className="h-4 w-4 text-slate-400" />
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 pt-0 flex-grow flex flex-col">
        <div className="flex-1 space-y-5">
          {assignments.length > 0 ? (
            assignments.map((assignment, i) => {
              const percentage = assignment.total_students > 0 
                  ? Math.round((assignment.submitted_count / assignment.total_students) * 100) 
                  : 0;
              const isFinished = percentage >= 80;

              return (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-black text-slate-700 truncate">{assignment.title}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                          {assignment.class} • {assignment.subject}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Clock size={10} className="text-slate-300" />
                      <span className="text-[9px] font-bold text-slate-400">
                          {format(new Date(assignment.due_date), "MMM dd")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          isFinished ? "bg-emerald-500" : "bg-rose-500"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className={cn(
                      "text-[10px] font-black min-w-[3rem] text-right",
                      isFinished ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {assignment.submitted_count}/{assignment.total_students}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-slate-400 text-sm font-medium">No active assignments</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-50">
          <Link 
            href="/main/materials"
            className="flex items-center justify-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
          >
            Give Homework <ArrowUpRight size={12} />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
