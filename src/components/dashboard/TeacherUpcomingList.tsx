"use client";

import { Calendar, Trophy, FileText, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn, formatDate } from "@/lib/utils";

interface TeacherUpcomingListProps {
  upcoming?: {
    id: string;
    title: string;
    time: string;
    category: string;
  }[];
}

export const TeacherUpcomingList = ({ upcoming = [] }: TeacherUpcomingListProps) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <Calendar size={20} />
           </div>
           <h3 className="text-lg font-bold text-slate-800">
             Upcoming
           </h3>
        </div>
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
          Live Feed
        </span>
      </div>

      <div className="flex-1 space-y-3">
        {upcoming.length > 0 ? (
          upcoming.map((item) => {
            const isExam = item.category?.toLowerCase() === "exam";
            return (
              <div key={item.id} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                <div className={cn(
                    "h-10 w-10 shrink-0 rounded-lg flex items-center justify-center border",
                    isExam ? "bg-rose-50 border-rose-100" : "bg-indigo-50 border-indigo-100"
                )}>
                  {isExam ? (
                    <FileText className="h-5 w-5 text-rose-500" />
                  ) : (
                    <Trophy className="h-5 w-5 text-indigo-500" />
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded",
                        isExam ? "bg-rose-500 text-white" : "bg-indigo-500 text-white"
                    )}>
                        {item.category}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {formatDate(item.time)}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-700 mt-1 truncate group-hover:text-slate-900 transition-colors">
                    {item.title}
                  </h4>
                </div>

                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500" />
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center">
            <Calendar size={32} className="mx-auto text-slate-100 mb-2" />
            <p className="text-slate-400 text-xs font-medium">No upcoming activities</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50">
        <button className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">
          View Full Calendar
        </button>
      </div>
    </div>
  );
};
